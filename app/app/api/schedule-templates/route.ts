// =============================================
// SCHEDULE TEMPLATES API - LIST & SEARCH
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import {
  SCHEDULE_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByScheduleType,
  getTemplatesByTags,
  getRecommendedTemplates,
  getCategories,
  getAllTags,
  getTemplateById,
} from '@/lib/automation/triggers/scheduleTemplates';

export const runtime = 'nodejs';

/**
 * GET /api/schedule-templates
 * List all schedule templates or search/filter
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const scheduleType = searchParams.get('schedule_type');
    const tags = searchParams.get('tags');
    const useCase = searchParams.get('use_case');
    const query = searchParams.get('query');
    const id = searchParams.get('id');

    // Get specific template by ID
    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        template,
        categories: getCategories(),
        tags: getAllTags(),
      });
    }

    let templates = [...SCHEDULE_TEMPLATES];

    // Filter by category
    if (category) {
      const validCategories = getCategories();
      if (!validCategories.includes(category as any)) {
        return NextResponse.json(
          { error: `Invalid category. Valid categories: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      templates = getTemplatesByCategory(category as any);
    }

    // Filter by schedule type
    if (scheduleType) {
      const validScheduleTypes = ['cron', 'interval', 'relative'];
      if (!validScheduleTypes.includes(scheduleType)) {
        return NextResponse.json(
          { error: `Invalid schedule_type. Valid types: ${validScheduleTypes.join(', ')}` },
          { status: 400 }
        );
      }
      const typeTemplates = getTemplatesByScheduleType(scheduleType as any);
      // If category was also specified, intersect the results
      if (category) {
        templates = templates.filter(t => 
          typeTemplates.some(tt => tt.id === t.id)
        );
      } else {
        templates = typeTemplates;
      }
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        const tagTemplates = getTemplatesByTags(tagArray);
        // Intersect with existing filters
        templates = templates.filter(t => 
          tagTemplates.some(tt => tt.id === t.id)
        );
      }
    }

    // Filter by use case (recommended templates)
    if (useCase) {
      const recommendedTemplates = getRecommendedTemplates(useCase);
      // Intersect with existing filters
      templates = templates.filter(t => 
        recommendedTemplates.some(rt => rt.id === t.id)
      );
    }

    // Search by query (search in name, description, use_case, and tags)
    if (query) {
      const queryLower = query.toLowerCase();
      templates = templates.filter(template => {
        const nameMatch = template.name.toLowerCase().includes(queryLower);
        const descMatch = template.description.toLowerCase().includes(queryLower);
        const useCaseMatch = template.use_case.toLowerCase().includes(queryLower);
        const tagMatch = template.tags.some(tag => tag.toLowerCase().includes(queryLower));
        const automationMatch = template.recommended_automation.toLowerCase().includes(queryLower);
        
        return nameMatch || descMatch || useCaseMatch || tagMatch || automationMatch;
      });
    }

    // Sort templates by category, then by name
    templates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      templates,
      categories: getCategories(),
      tags: getAllTags(),
      schedule_types: ['cron', 'interval', 'relative'],
      total: templates.length,
      filters_applied: {
        category: category || null,
        schedule_type: scheduleType || null,
        tags: tags ? tags.split(',').map(t => t.trim()) : null,
        use_case: useCase || null,
        query: query || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching schedule templates:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}











