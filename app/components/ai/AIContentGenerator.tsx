'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, Mail, MessageSquare, Share2, HelpCircle, Loader2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/SelectGroup';
import { TextArea } from '@/components/ui/TextArea';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';

interface AIContentGeneratorProps {
  propertyId: string;
  onContentGenerated?: (content: any) => void;
}

interface GeneratedContent {
  content_type: string;
  variant: number;
  content_id?: string;
  content: string;
  error?: string;
}

export default function AIContentGenerator({ propertyId, onContentGenerated }: AIContentGeneratorProps) {
  const [contentTypes, setContentTypes] = useState<string[]>(['description']);
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [model, setModel] = useState('gpt-4');
  const [variants, setVariants] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const supabase = getSupabase();

  const contentTypeOptions = [
    { value: 'description', label: 'Property Description', icon: FileText },
    { value: 'highlights', label: 'Key Highlights', icon: Sparkles },
    { value: 'email_subject', label: 'Email Subject Lines', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp Message', icon: MessageSquare },
    { value: 'social', label: 'Social Media Post', icon: Share2 },
    { value: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  const toggleContentType = (type: string) => {
    setContentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const generateContent = async () => {
    if (contentTypes.length === 0) {
      toast.error('Please select at least one content type');
      return;
    }

    setGenerating(true);
    setGeneratedContent([]);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${API_URL}/api/ai-content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
          content_types: contentTypes,
          tone,
          language,
          model,
          variants,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Generation failed');
      }

      const result = await response.json();
      setGeneratedContent(result.results || []);

      if (result.generated_count > 0) {
        toast.success(`Generated ${result.generated_count} content piece(s)!`);
      }

      if (onContentGenerated) {
        onContentGenerated(result);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error('Generation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const approveContent = async (contentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to approve content');
        return;
      }

      const { error } = await supabase
        .from('ai_generated_content')
        .update({
          is_approved: true,
          approved_by: user.id,
        })
        .eq('id', contentId);

      if (error) throw error;

      toast.success('Content approved!');
      // Update local state
      setGeneratedContent(prev =>
        prev.map(c => c.content_id === contentId ? { ...c } : c)
      );
    } catch (error: any) {
      console.error('Approval failed:', error);
      toast.error('Failed to approve content');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-3">
              <Sparkles className="w-6 h-6 text-gold-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Content Generator</h2>
              <p className="text-white/60">Generate compelling property content with AI</p>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <h3 className="text-white font-semibold mb-4">Content Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {contentTypeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => toggleContentType(value)}
                className={`
                  relative rounded-xl p-4 border-2 transition-all duration-300
                  ${contentTypes.includes(value)
                    ? 'border-gold-500 bg-gold-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-5 h-5 mb-2 mx-auto" />
                <p className="text-sm font-medium">{label}</p>
                {contentTypes.includes(value) && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4 text-gold-500" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Tone</label>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="luxury">Luxury</option>
                <option value="friendly">Friendly</option>
              </Select>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Language</label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
              </Select>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Model</label>
              <Select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </Select>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Variants</label>
              <Select
                value={variants.toString()}
                onChange={(e) => setVariants(parseInt(e.target.value))}
                className="bg-white/5 border-white/20 text-white"
              >
                <option value="1">1 Variant</option>
                <option value="2">2 Variants</option>
                <option value="3">3 Variants</option>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateContent}
            disabled={generating || contentTypes.length === 0}
            variant="primary"
            className="w-full mt-6 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-primary-950 shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </div>

        {/* Generated Content */}
        {generatedContent.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Generated Content</h3>
            {generatedContent.map((content, index) => {
              if (content.error) {
                return (
                  <div
                    key={index}
                    className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-red-500/10 border border-red-500/30 p-4"
                  >
                    <p className="text-red-400 text-sm">{content.error}</p>
                  </div>
                );
              }

              const contentTypeLabel = contentTypeOptions.find(opt => opt.value === content.content_type)?.label || content.content_type;

              return (
                <div
                  key={index}
                  className="group relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 p-6"
                >
                  {/* Shimmer Effect */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge tone="default" className="bg-white/20 text-white border-white/30">
                          {contentTypeLabel}
                        </Badge>
                        {content.variant > 0 && (
                          <Badge tone="default" className="bg-white/10 text-white/60 border-white/20 text-xs">
                            Variant {content.variant + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="invisible"
                          size="sm"
                          onClick={() => copyToClipboard(content.content)}
                          className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        {content.content_id && (
                          <Button
                            variant="invisible"
                            size="sm"
                            onClick={() => approveContent(content.content_id!)}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{content.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

