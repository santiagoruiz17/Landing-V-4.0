import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../lib/supabase';

interface BlogPostFull {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_html: string;
  category: string | null;
  published_at: string;
}

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, cover_image_url, content_html, category, published_at')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data);
        }
        setLoading(false);
      });
  }, [slug]);

  useSEO({
    title: post ? `${post.title} | Blog Firma 7` : 'Blog | Firma 7',
    description: post?.excerpt || 'Consejos sobre crédito empresarial y financiamiento PyME en México.',
    canonical: `https://firma7.com/blog/${slug ?? ''}`,
    noindex: !post,
  });

  const sanitizedHtml = post ? DOMPurify.sanitize(post.content_html) : '';

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
            onClick={() => navigate('/blog')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#006d4e] text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Ver blog
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {loading && <p className="text-center text-gray-400 py-12">Cargando…</p>}

        {!loading && notFound && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <h1 className="font-serif text-2xl text-charcoal font-bold mb-2">Artículo no encontrado</h1>
            <p className="text-gray-500 text-sm mb-5">Puede que este artículo ya no esté disponible.</p>
            <button
              onClick={() => navigate('/blog')}
              className="px-6 py-2.5 bg-firma-green text-white rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              Ver todos los artículos
            </button>
          </div>
        )}

        {!loading && post && (
          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {post.cover_image_url && (
              <img src={post.cover_image_url} alt={post.title} className="w-full aspect-video object-cover" />
            )}
            <div className="p-6 sm:p-10">
              {post.category && (
                <span className="inline-block text-[10px] font-bold tracking-widest text-firma-green uppercase mb-3">
                  {post.category}
                </span>
              )}
              <h1 className="font-serif text-2xl sm:text-4xl text-charcoal font-bold mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
                <Calendar size={12} />
                {new Date(post.published_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div
                className="prose prose-sm sm:prose-base max-w-none prose-headings:font-serif prose-headings:text-charcoal prose-a:text-firma-green"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            </div>
          </article>
        )}

        {!loading && post && (
          <div className="mt-8 bg-gradient-to-r from-firma-green to-green-700 rounded-2xl shadow-xl p-8 text-center">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-3">
              ¿Listo para impulsar tu empresa?
            </h3>
            <p className="text-green-50 mb-6 max-w-xl mx-auto text-sm sm:text-base">
              Completa tu perfil en minutos y te conectamos con la institución financiera ideal para tu negocio.
            </p>
            <button
              onClick={() => navigate('/perfil')}
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-firma-green font-bold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Iniciar mi pre-calificación
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
