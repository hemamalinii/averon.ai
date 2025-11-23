'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Save, LayoutDashboard, BarChart3 } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

export default function TaxonomyPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/taxonomy');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadTaxonomy();
    }
  }, [session]);

  const loadTaxonomy = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Load all categories (defaults + user custom)
      const response = await fetch('/api/categories?include_defaults=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load taxonomy:', error);
      toast.error('failed to load taxonomy');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('category name cannot be empty');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
      toast.error('category already exists');
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory,
          description: newDescription || null,
          userId: session?.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      const newCat = await response.json();
      setCategories([...categories, newCat]);
      setNewCategory('');
      setNewDescription('');
      toast.success('category added');
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('failed to add category');
    }
  };

  const removeCategory = async (category: any) => {
    if (category.isDefault) {
      toast.error('cannot remove default categories');
      return;
    }

    if (categories.filter(c => !c.isDefault).length <= 1) {
      toast.error('must have at least one custom category');
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(categories.filter((c) => c.id !== category.id));
      toast.success('category removed');
    } catch (error) {
      console.error('Failed to remove category:', error);
      toast.error('failed to remove category');
    }
  };

  const loadTemplate = async (templateCategories: string[]) => {
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Add each template category
      for (const catName of templateCategories) {
        if (!categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
          await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: catName,
              description: null,
              userId: session?.user.id,
            }),
          });
        }
      }

      await loadTaxonomy();
      toast.success('template loaded');
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('failed to load template');
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const defaultCategories = categories.filter(c => c.isDefault);
  const customCategories = categories.filter(c => !c.isDefault);

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight hover:opacity-60 transition-opacity">
            averon.ai
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <LayoutDashboard className="w-4 h-4" /> dashboard
              </Button>
            </Link>
            <Link href="/evaluation">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-blue-500 rounded-none px-0 h-auto py-1 gap-2">
                <BarChart3 className="w-4 h-4" /> evaluation
              </Button>
            </Link>
            <Link href="/results">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <ArrowLeft className="w-4 h-4" /> back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-16">
          <h1 className="text-4xl font-light text-white mb-4">taxonomy manager</h1>
          <p className="text-neutral-400 font-light">
            configure custom transaction categories
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Add Category */}
          <div className="border border-neutral-700">
            <div className="border-b border-neutral-700 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">add category</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  category name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Entertainment"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addCategory()}
                  className="w-full bg-black border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Movies, concerts, events"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  className="w-full bg-black border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <button
                onClick={addCategory}
                className="w-full border-2 border-white px-6 py-3 hover:border-yellow-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-sm font-medium tracking-wide text-white">add category</span>
              </button>

              <div className="border border-neutral-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">tips</p>
                <ul className="text-xs text-neutral-400 space-y-2 font-light">
                  <li>• use clear, descriptive names</li>
                  <li>• avoid special characters</li>
                  <li>• keep it concise (1-3 words)</li>
                  <li>• maintain consistency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Categories */}
          <div className="border border-neutral-700">
            <div className="border-b border-neutral-700 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                your categories <span className="text-neutral-500">({categories.length})</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Default Categories */}
                {defaultCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                      default categories
                    </p>
                    <div className="space-y-2">
                      {defaultCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border border-neutral-800"
                        >
                          <div>
                            <span className="text-sm font-light text-white">{category.name}</span>
                            {category.description && (
                              <p className="text-xs text-neutral-600 mt-1">{category.description}</p>
                            )}
                          </div>
                          <span className="text-xs text-neutral-600">default</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Categories */}
                {customCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                      custom categories
                    </p>
                    <div className="space-y-2">
                      {customCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border border-neutral-800 hover:border-neutral-700 transition-colors"
                        >
                          <div>
                            <span className="text-sm font-light text-white">{category.name}</span>
                            {category.description && (
                              <p className="text-xs text-neutral-600 mt-1">{category.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeCategory(category)}
                            className="text-neutral-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {categories.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-12 font-light">
                    no categories yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="border border-neutral-700 mt-16">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">templates</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => loadTemplate(DEFAULT_CATEGORIES.map(c => c.name))}
                className="border border-neutral-700 p-6 text-left hover:border-blue-500 transition-colors"
              >
                <p className="text-sm font-semibold mb-3 text-white">personal finance</p>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CATEGORIES.slice(0, 5).map((cat) => (
                    <span key={cat.name} className="text-xs text-neutral-500 font-light">
                      {cat.name}
                    </span>
                  ))}
                  <span className="text-xs text-neutral-600">+{DEFAULT_CATEGORIES.length - 5} more</span>
                </div>
              </button>

              <button
                onClick={() => loadTemplate(['Income', 'Expenses', 'Savings', 'Investments', 'Taxes'])}
                className="border border-neutral-700 p-6 text-left hover:border-yellow-400 transition-colors"
              >
                <p className="text-sm font-semibold mb-3 text-white">accounting</p>
                <div className="flex flex-wrap gap-2">
                  {['Income', 'Expenses', 'Savings', 'Investments', 'Taxes'].map((cat) => (
                    <span key={cat} className="text-xs text-neutral-500 font-light">
                      {cat}
                    </span>
                  ))}
                </div>
              </button>

              <button
                onClick={() => loadTemplate(['Paycheck', 'Bonus', 'Refunds', 'Interest', 'Other Income'])}
                className="border border-neutral-700 p-6 text-left hover:border-blue-500 transition-colors"
              >
                <p className="text-sm font-semibold mb-3 text-white">income tracking</p>
                <div className="flex flex-wrap gap-2">
                  {['Paycheck', 'Bonus', 'Refunds', 'Interest', 'Other Income'].map((cat) => (
                    <span key={cat} className="text-xs text-neutral-500 font-light">
                      {cat}
                    </span>
                  ))}
                </div>
              </button>

              <button
                onClick={() => loadTemplate(['Fixed Costs', 'Variable Expenses', 'Discretionary', 'Debt Payments'])}
                className="border border-neutral-700 p-6 text-left hover:border-yellow-400 transition-colors"
              >
                <p className="text-sm font-semibold mb-3 text-white">budget planning</p>
                <div className="flex flex-wrap gap-2">
                  {['Fixed Costs', 'Variable Expenses', 'Discretionary', 'Debt Payments'].map((cat) => (
                    <span key={cat} className="text-xs text-neutral-500 font-light">
                      {cat}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="border border-neutral-800 mt-16 p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-white">how it works</h3>
          <div className="text-sm text-neutral-400 font-light leading-relaxed space-y-3">
            <p>
              the ai model classifies transactions into these categories using:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• keyword and merchant name matching</li>
              <li>• semantic similarity via shap</li>
              <li>• historical feedback patterns</li>
            </ul>
            <p className="pt-3">
              changes take effect immediately. no retraining required.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}