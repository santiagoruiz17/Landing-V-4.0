import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';

interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
}

export const Blog: React.FC = () => {
  useSEO({
    title: 'Blog | Firma 7 — Consultoría Financiera',
    description: 'Consejos y análisis sobre crédito empresarial, financiamiento PyME y estrategia financiera en México.',
    canonical: 'https://firma7.com/blog',
  });

  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, cover_image_url, category, published_at')
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-charcoal">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <svg viewBox="0 0 100 100" fill="#006d4e" className="w-9 h-9">
              <circle cx="50" cy="50" r="12"/><circle cx="50" cy="20" r="12"/><circle cx="50" cy="80" r="12"/>
              <circle cx="24" cy="35" r="12"/><circle cx="24" cy="65" r="12"/><circle cx="76" cy="35" r="12"/><circle cx="76" cy="65" r="12"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#006d4e]">SOC</span>
                <div className="h-5 w-px bg-[#006d4e]" />
                <span className="text-xl font-medium text-[#006d4e]">FIRMA 7</span>
              </div>
              <span className="hidden sm:block text-[0.5rem] font-bold tracking-[0.15em] text-[#006d4e] uppercase">
                LÍDERES EN ASESORÍA FINANCIERA
              </span>
            </div>
          </a>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#006d4e] text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Ir al inicio
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-12">
          <span className="inline-block py-1 px-3 border border-firma-green/20 rounded-full text-[10px] font-bold tracking-widest text-firma-green uppercase mb-4 bg-firma-green/5">
            Blog
          </span>
          <h1 className="font-serif text-3xl md:text-5xl text-charcoal font-bold mb-4">
            Ideas para crecer tu <span className="italic text-firma-green">empresa</span>
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Consejos prácticos sobre crédito empresarial, financiamiento y estrategia financiera para PyMEs en México.
          </p>
        </div>

        {loading && (
          <p className="text-center text-gray-400 py-12">Cargando artículos…</p>
        )}

        {!loading && posts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-lg mx-auto">
            <FileText size={28} className="text-firma-green mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Muy pronto publicaremos nuestros primeros artículos.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-firma-green/5">
                      <FileText size={32} className="text-firma-green/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {post.category && (
                    <span className="inline-block text-[10px] font-bold tracking-widest text-firma-green uppercase mb-2">
                      {post.category}
                    </span>
                  )}
                  <h2 className="font-serif text-lg text-charcoal font-bold mb-2 group-hover:text-firma-green transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 text-sm line-clamp-3 mb-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
                    {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
