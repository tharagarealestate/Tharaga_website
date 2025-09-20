from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, List, Optional

import numpy as np
import pandas as pd
from numpy.typing import NDArray
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

from .schemas import PropertySpecs, RecommendationItem


@dataclass
class ModelArtifacts:
    tfidf_matrix: csr_matrix
    tfidf_feature_names: List[str]
    svd_cf: TruncatedSVD
    property_id_to_index: dict[str, int]
    index_to_property_id: dict[int, str]
    user_ids: set[str]


class HybridRecommender:
    """Hybrid CF + Content-based recommender with reason generation.

    - Content: TF-IDF on concatenated property text fields (title, location, amenities, description)
    - CF: Surprise SVD trained on explicit or implicit ratings from interactions
    - Hybrid score: 0.6 * CF + 0.4 * ContentSimilarityToUserProfile
    """

    def __init__(self, properties_df: pd.DataFrame, interactions_df: pd.DataFrame):
        required_property_cols = {"property_id", "title", "description", "location", "amenities", "image_url", "bedrooms", "bathrooms", "area_sqft"}
        missing = required_property_cols - set(properties_df.columns)
        if missing:
            raise ValueError(f"properties_df missing columns: {missing}")
        required_inter_cols = {"user_id", "property_id", "event", "value"}
        missing_i = required_inter_cols - set(interactions_df.columns)
        if missing_i:
            raise ValueError(f"interactions_df missing columns: {missing_i}")
        self.properties_df = properties_df.reset_index(drop=True).copy()
        self.interactions_df = interactions_df.reset_index(drop=True).copy()
        self._artifacts: Optional[ModelArtifacts] = None

    def fit(self) -> None:
        # Build TF-IDF matrix
        text_series = self._build_property_corpus(self.properties_df)
        vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words="english")
        tfidf_matrix = vectorizer.fit_transform(text_series)
        feature_names = list(vectorizer.get_feature_names_out())

        # Build a simple CF via user-item matrix + TruncatedSVD (latent factors)
        ratings_df = self._build_ratings(self.interactions_df)
        all_users = ratings_df["user_id"].unique().tolist()
        all_items = self.properties_df["property_id"].tolist()
        user_index = {u: i for i, u in enumerate(all_users)}
        item_index = {p: i for i, p in enumerate(all_items)}
        # Sparse matrix shape [num_users, num_items]
        rows = [user_index[u] for u in ratings_df["user_id"]]
        cols = [item_index.get(p, -1) for p in ratings_df["property_id"]]
        vals = ratings_df["rating"].astype(float).to_numpy()
        valid = [c >= 0 for c in cols]
        ui = csr_matrix((vals[valid], (np.array(rows)[valid], np.array(cols)[valid])), shape=(len(all_users), len(all_items)))
        svd_cf = TruncatedSVD(n_components=min(50, max(2, min(ui.shape) - 1)), random_state=42)
        user_factors = svd_cf.fit_transform(ui)
        item_factors = svd_cf.components_.T  # [num_items, k]
        # Store mapping for prediction
        self._user_index = user_index
        self._item_index = item_index
        self._user_factors = user_factors
        self._item_factors = item_factors

        property_id_to_index = {pid: idx for idx, pid in enumerate(self.properties_df["property_id"]) }
        index_to_property_id = {idx: pid for pid, idx in property_id_to_index.items()}

        self._artifacts = ModelArtifacts(
            tfidf_matrix=tfidf_matrix.tocsr(),
            tfidf_feature_names=feature_names,
            svd_cf=svd_cf,
            property_id_to_index=property_id_to_index,
            index_to_property_id=index_to_property_id,
            user_ids=set(ratings_df["user_id"].unique().tolist()),
        )

    def recommend(self, user_id: Optional[str], session_id: Optional[str], top_n: int = 10) -> List[RecommendationItem]:
        if self._artifacts is None:
            raise RuntimeError("Model not trained. Call fit() first.")

        # For now session_id behaves like cold-start; use content-only if user unknown
        if user_id is None or user_id not in self._artifacts.user_ids:
            return self._recommend_cold_start(top_n=top_n)
        return self._recommend_hybrid(user_id=user_id, top_n=top_n)

    # Internal helpers
    def _recommend_cold_start(self, top_n: int) -> List[RecommendationItem]:
        # Rank by content popularity proxy: cosine similarity to global centroid
        tfidf = self._artifacts.tfidf_matrix  # type: ignore[union-attr]
        centroid = tfidf.mean(axis=0)
        sims = cosine_similarity(tfidf, centroid)
        # sims shape: (num_properties, 1)
        scores = sims.ravel()
        top_indices = np.argsort(scores)[::-1][:top_n]
        return [self._build_item_from_index(int(idx), float(scores[idx]), reasons=self._reasons_from_terms(int(idx))) for idx in top_indices]

    def _recommend_hybrid(self, user_id: str, top_n: int) -> List[RecommendationItem]:
        tfidf = self._artifacts.tfidf_matrix  # type: ignore[union-attr]

        # Compute CF scores
        all_property_ids = self.properties_df["property_id"].tolist()
        cf_scores = []
        for pid in all_property_ids:
            cf_scores.append(self._predict_cf_score(user_id, pid))
        cf_scores_arr = np.asarray(cf_scores)

        # Build user profile vector from user's highly-rated items
        ratings_df = self._build_ratings(self.interactions_df)
        user_hist = ratings_df[(ratings_df["user_id"] == user_id) & (ratings_df["rating"] >= 4.0)]["property_id"].tolist()
        if user_hist:
            indices = [self._artifacts.property_id_to_index[pid] for pid in user_hist if pid in self._artifacts.property_id_to_index]  # type: ignore[union-attr]
            if indices:
                user_profile = tfidf[indices].mean(axis=0)
                content_scores = cosine_similarity(tfidf, user_profile).ravel()
            else:
                content_scores = np.zeros(tfidf.shape[0])
        else:
            content_scores = np.zeros(tfidf.shape[0])

        # Combine
        hybrid_scores = 0.6 * _normalize(cf_scores_arr) + 0.4 * _normalize(content_scores)

        ranked_indices = np.argsort(hybrid_scores)[::-1]

        # Exclude already highly-rated properties
        seen_set = set(user_hist)
        result: List[RecommendationItem] = []
        for idx in ranked_indices:
            pid = self._artifacts.index_to_property_id[int(idx)]  # type: ignore[union-attr]
            if pid in seen_set:
                continue
            item = self._build_item_from_index(int(idx), float(hybrid_scores[int(idx)]), reasons=self._reasons_for_user_item(user_id, int(idx)))
            result.append(item)
            if len(result) >= top_n:
                break
        return result

    def _build_item_from_index(self, index: int, score: float, reasons: List[str]) -> RecommendationItem:
        row = self.properties_df.iloc[index]
        return RecommendationItem(
            property_id=str(row.property_id),
            title=str(row.title),
            image_url=str(row.image_url),
            specs=PropertySpecs(
                bedrooms=int(row.bedrooms) if not pd.isna(row.bedrooms) else None,
                bathrooms=int(row.bathrooms) if not pd.isna(row.bathrooms) else None,
                area_sqft=float(row.area_sqft) if not pd.isna(row.area_sqft) else None,
                location=str(row.location) if not pd.isna(row.location) else None,
            ),
            reasons=reasons[:3],
            score=max(0.0, float(score)),
        )

    def _reasons_for_user_item(self, user_id: str, index: int) -> List[str]:
        # Use content overlap terms plus simple heuristic based on specs
        reasons = self._reasons_from_terms(index)
        row = self.properties_df.iloc[index]
        spec_bits = []
        if not pd.isna(row.bedrooms):
            spec_bits.append(f"{int(row.bedrooms)} BHK")
        if not pd.isna(row.location):
            spec_bits.append(f"in {row.location}")
        if spec_bits:
            reasons.append("Matches your interest: " + ", ".join(spec_bits))
        return reasons

    def _reasons_from_terms(self, index: int) -> List[str]:
        tfidf = self._artifacts.tfidf_matrix  # type: ignore[union-attr]
        feature_names = self._artifacts.tfidf_feature_names  # type: ignore[union-attr]
        row = tfidf[index]
        # Get top 3 terms
        if row.nnz == 0:
            return []
        data = row.data
        indices = row.indices
        top_local = np.argsort(data)[-3:][::-1]
        terms = [feature_names[indices[i]] for i in top_local]
        return [f"Similar to your preferences: {term}" for term in terms]

    def _predict_cf_score(self, user_id: str, property_id: str) -> float:
        # Dot product in latent space; if user unseen, 0
        if user_id not in self._user_index or property_id not in self._item_index:
            return 0.0
        u_idx = self._user_index[user_id]
        i_idx = self._item_index[property_id]
        u_vec = self._user_factors[u_idx]
        i_vec = self._item_factors[i_idx]
        return float(np.dot(u_vec, i_vec))

    @staticmethod
    def _build_property_corpus(df: pd.DataFrame) -> pd.Series:
        text = (
            df["title"].fillna("") + " "
            + df["location"].fillna("") + " "
            + df["amenities"].fillna("") + " "
            + df["description"].fillna("")
        )
        return text

    @staticmethod
    def _build_ratings(interactions: pd.DataFrame) -> pd.DataFrame:
        # Map events to implicit rating strengths
        weights = {"view": 2.0, "favorite": 5.0, "contact": 5.0, "share": 3.0}
        temp = interactions.copy()
        temp["weight"] = temp["event"].map(weights).fillna(1.0)
        # Aggregate per user-property
        grouped = temp.groupby(["user_id", "property_id"], as_index=False)[["weight", "value"]].sum()
        grouped["rating"] = (grouped["weight"] + grouped["value"].fillna(0.0)).clip(1.0, 5.0)
        return grouped[["user_id", "property_id", "rating"]]


def _normalize(arr: NDArray[np.float64]) -> NDArray[np.float64]:
    if arr.size == 0:
        return arr
    min_v = float(np.min(arr))
    max_v = float(np.max(arr))
    if math.isclose(max_v, min_v):
        return np.zeros_like(arr)
    return (arr - min_v) / (max_v - min_v)


def load_demo_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    # Minimal synthetic dataset for bootstrapping and tests
    properties = pd.DataFrame(
        [
            {"property_id": "P1", "title": "Modern 2BHK in Koramangala", "description": "Bright, airy, balcony, near cafes", "location": "Koramangala, Bengaluru", "amenities": "gym pool parking", "image_url": "https://picsum.photos/seed/p1/800/600", "bedrooms": 2, "bathrooms": 2, "area_sqft": 950},
            {"property_id": "P2", "title": "Luxury Villa in Whitefield", "description": "Gated community, private garden", "location": "Whitefield, Bengaluru", "amenities": "garden parking clubhouse", "image_url": "https://picsum.photos/seed/p2/800/600", "bedrooms": 4, "bathrooms": 4, "area_sqft": 3200},
            {"property_id": "P3", "title": "Cozy Studio near MG Road", "description": "Walk to metro, compact living", "location": "MG Road, Bengaluru", "amenities": "metro access security", "image_url": "https://picsum.photos/seed/p3/800/600", "bedrooms": 1, "bathrooms": 1, "area_sqft": 450},
            {"property_id": "P4", "title": "Spacious 3BHK in Indiranagar", "description": "Premium fittings, large living room", "location": "Indiranagar, Bengaluru", "amenities": "gym clubhouse balcony", "image_url": "https://picsum.photos/seed/p4/800/600", "bedrooms": 3, "bathrooms": 3, "area_sqft": 1550},
        ]
    )
    interactions = pd.DataFrame(
        [
            {"user_id": "U1", "property_id": "P1", "event": "view", "value": 1.0},
            {"user_id": "U1", "property_id": "P1", "event": "favorite", "value": 1.0},
            {"user_id": "U1", "property_id": "P4", "event": "view", "value": 1.0},
            {"user_id": "U2", "property_id": "P2", "event": "favorite", "value": 1.0},
            {"user_id": "U2", "property_id": "P3", "event": "view", "value": 1.0},
        ]
    )
    return properties, interactions

