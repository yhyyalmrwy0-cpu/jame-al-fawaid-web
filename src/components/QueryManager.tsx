import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Trash, Edit, Plus, Save, X, BookOpen, Calendar, HelpCircle, CheckSquare, Square, Mic, MicOff, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { ScientificQuery } from '../types';
import { formatToHijriAndGregorian } from '../utils';

interface QueryManagerProps {
  queries: ScientificQuery[];
  onAddQuery: (query: Omit<ScientificQuery, 'id' | 'createdAt'>) => void;
  onUpdateQuery: (query: ScientificQuery) => void;
  onDeleteQuery: (id: string) => void;
  onConvertToBenefit: (query: ScientificQuery) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export const QueryManager: React.FC<QueryManagerProps> = ({
  queries,
  onAddQuery,
  onUpdateQuery,
  onDeleteQuery,
  onConvertToBenefit,
  showToast,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuery, setEditingQuery] = useState<ScientificQuery | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const [isResolved, setIsResolved] = useState(false);
  const [resolution, setResolution] = useState('');

  // Delete Confirm Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter state
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

  // Speech and Inline Resolution states
  const [listeningField, setListeningField] = useState<'title' | 'content' | null>(null);
  const [solvingQueryId, setSolvingQueryId] = useState<string | null>(null);
  const [inlineResolution, setInlineResolution] = useState('');
  const [isListeningResolution, setIsListeningResolution] = useState(false);

  const startVoiceInput = (field: 'title' | 'content') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast('المتصفح الحالي لا يدعم ميزة الإدخال الصوتي.', 'warning');
      return;
    }

    if (listeningField === field) {
      setListeningField(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListeningField(field);
        showToast('جاري الاستماع... تحدث باللغة العربية الآن 🎙️', 'info');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListeningField(null);
        if (event.error === 'not-allowed') {
          showToast('تم رفض إذن الوصول للميكروفون! يرجى تفعيله من إعدادات المتصفح.', 'warning');
        } else {
          showToast('فشل التعرف على الصوت، يرجى المحاولة مجدداً.', 'warning');
        }
      };

      recognition.onend = () => {
        setListeningField(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (field === 'title') {
            setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
          } else {
            setContent(prev => prev ? `${prev} ${transcript}` : transcript);
          }
          showToast('تم تسجيل النص بنجاح ✨', 'success');
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تشغيل ميزة التعرف على الصوت.', 'warning');
      setListeningField(null);
    }
  };

  const startVoiceInputForResolution = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      showToast('المتصفح الحالي لا يدعم ميزة الإدخال الصوتي.', 'warning');
      return;
    }

    if (isListeningResolution) {
      setIsListeningResolution(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningResolution(true);
        showToast('جاري الاستماع للتحقيق العلمي... تحدث الآن 🎙️', 'info');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListeningResolution(false);
        if (event.error === 'not-allowed') {
          showToast('تم رفض إذن الوصول للميكروفون! يرجى تفعيله من إعدادات المتصفح.', 'warning');
        } else {
          showToast('فشل التعرف على الصوت، يرجى المحاولة مجدداً.', 'warning');
        }
      };

      recognition.onend = () => {
        setIsListeningResolution(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInlineResolution(prev => prev ? `${prev} ${transcript}` : transcript);
          showToast('تم إضافة التحقيق الصوتي بنجاح ✨', 'success');
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء تشغيل ميزة التعرف على الصوت.', 'warning');
      setIsListeningResolution(false);
    }
  };

  const handleSaveInlineResolution = (q: ScientificQuery) => {
    if (!inlineResolution.trim()) {
      showToast('يرجى كتابة التحقيق العلمي أولاً لإقفال الاستشكال!', 'warning');
      return;
    }

    onUpdateQuery({
      ...q,
      isResolved: true,
      resolution: inlineResolution.trim(),
    });

    setSolvingQueryId(null);
    setInlineResolution('');
    showToast('الحمد لله! تم حل الاستشكال بنجاح وتوثيق مخرجه العلمي.', 'success');
  };

  const openAddForm = () => {
    setTitle('');
    setContent('');
    setSource('');
    const today = new Date();
    setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    setIsResolved(false);
    setResolution('');
    setEditingQuery(null);
    setIsAdding(true);
  };

  const openEditForm = (q: ScientificQuery) => {
    setEditingQuery(q);
    setTitle(q.title);
    setContent(q.content);
    setSource(q.source);
    setDate(q.date);
    setIsResolved(q.isResolved);
    setResolution(q.resolution || '');
    setIsAdding(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      showToast('يرجى ملء عنوان الاستشكال ومضمونه أولاً!', 'warning');
      return;
    }

    const formData = {
      title: title.trim(),
      content: content.trim(),
      source: source.trim(),
      date: date || new Date().toISOString().split('T')[0],
      isResolved,
      resolution: isResolved ? resolution.trim() : '',
    };

    if (editingQuery) {
      onUpdateQuery({
        ...editingQuery,
        ...formData,
      });
      showToast('تم تعديل الاستشكال العلمي وحفظه بنجاح!', 'success');
    } else {
      onAddQuery(formData);
      showToast('تم حفظ الاستشكال العلمي للمراجعة والبحث لاحقاً.', 'success');
    }

    setIsAdding(false);
    setEditingQuery(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDeleteQuery(deleteId);
      showToast('تم حذف الاستشكال بنجاح.', 'info');
      setDeleteId(null);
    }
  };

  const toggleResolveStatus = (q: ScientificQuery) => {
    const nextStatus = !q.isResolved;
    onUpdateQuery({
      ...q,
      isResolved: nextStatus,
      resolution: nextStatus ? (q.resolution || 'تم حل الاستشكال والحمد لله.') : '',
    });
    showToast(nextStatus ? 'الحمد لله! تم حل الاستشكال وتحديث حالته.' : 'أعيد الاستشكال العلمي تحت البحث والتحقيق.', 'info');
  };

  const filteredQueries = queries.filter((q) => {
    if (filter === 'unresolved') return !q.isResolved;
    if (filter === 'resolved') return q.isResolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Intro section and trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-cream/20 p-5 rounded-2xl border border-brand-cream/60">
        <div className="text-right">
          <h2 className="text-lg font-bold text-brand-emerald-dark font-sans flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-gold animate-bounce" />
            منصة إدارة الاستشكالات والمسائل العلمية العالقة
          </h2>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
            قيد المسائل الصعبة أو النقولات التي تثير عندك لبساً لمراجعتها والبحث والتحقيق فيها لاحقاً.
          </p>
        </div>
        
        {!isAdding && (
          <button
            onClick={openAddForm}
            className="px-5 py-2.5 rounded-xl bg-brand-emerald hover:bg-brand-emerald-light text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-brand-gold-light" />
            <span>إضافة استشكال علمي جديد</span>
          </button>
        )}
      </div>

      {/* Query Add/Edit Form Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-brand-cream/60 custom-shadow space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-2">
                <h3 className="text-base font-bold text-brand-emerald-dark font-sans flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-brand-gold" />
                  {editingQuery ? 'تعديل الاستشكال وتحقيقه' : 'تسجيل استشكال علمي جديد'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700">عنوان الاستشكال العلمي *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: تعارض ظاهر حديث الآحاد مع عموم القرآن في مسألة..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput('title')}
                    className={`absolute left-3 top-2.5 p-1 rounded-lg transition-all cursor-pointer ${
                      listeningField === 'title' 
                        ? 'text-red-600 bg-red-50 animate-pulse ring-2 ring-red-200' 
                        : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
                    }`}
                    title="إدخال صوتي باللغة العربية"
                  >
                    {listeningField === 'title' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Content input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-zinc-700">نص الاستشكال واللبس بالتفصيل *</label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <InfinityIcon className="w-3 h-3 text-emerald-600" />
                    <span>سعة مفتوحة لا محدودة</span>
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="وضح المسألة والوجه الذي وقع فيه الإشكال بدقة وعناية... (بدون أي حد أقصى للحجم)"
                    rows={5}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-serif text-sm text-zinc-800 bg-zinc-50/50 leading-relaxed resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => startVoiceInput('content')}
                    className={`absolute left-3 top-3 p-1 rounded-lg transition-all cursor-pointer ${
                      listeningField === 'content' 
                        ? 'text-red-600 bg-red-50 animate-pulse ring-2 ring-red-200' 
                        : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
                    }`}
                    title="إدخال صوتي باللغة العربية"
                  >
                    {listeningField === 'content' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] font-sans text-zinc-500 px-1 pt-0.5">
                  <span>الكلمات: {(content.trim() ? content.trim().split(/\s+/).length : 0).toLocaleString('ar-SA')} • الحروف: {content.length.toLocaleString('ar-SA')}</span>
                  <span className="text-emerald-700 font-bold">♾️ استيعاب غير محدود</span>
                </div>
              </div>

              {/* Grid: Source & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand-gold" />
                    المصدر أو الموضع المسبب للإشكال
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="مثال: تفسير القرطبي ج٥ ص١٢"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-800 bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-emerald focus:border-transparent transition-all font-sans text-sm text-zinc-700 bg-zinc-50/50"
                  />
                </div>
              </div>

              {/* Resolved Switcher */}
              <div className="bg-brand-cream/10 border border-brand-cream/40 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-right">
                    <span className="text-sm font-bold text-brand-emerald-dark block">هل تم مراجعة وحل الاستشكال؟</span>
                    <span className="text-xs text-zinc-500 block">قم بالتفعيل إذا توصلت إلى مخرج وحل علمي للإشكال</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isResolved}
                      onChange={(e) => setIsResolved(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Optional resolution textbox */}
                <AnimatePresence>
                  {isResolved && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 pt-2 border-t border-brand-cream/30 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-emerald-800 block">
                        التحقيق العلمي وحل الإشكال (النتيجة والمخرج) *
                      </label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="اكتب هنا التحقيق وجواب أهل العلم والنتيجة التي انشرح صدرك لها وحلت الإشكال..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-serif text-sm text-zinc-800 bg-emerald-50/20 leading-relaxed"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-brand-emerald hover:bg-brand-emerald-light text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-brand-gold-light" />
                  <span>حفظ الاستشكال</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doubts filters tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-brand-emerald-dark text-white'
              : 'text-zinc-500 hover:bg-brand-cream/30 hover:text-brand-emerald'
          }`}
        >
          الكل ({queries.length})
        </button>
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            filter === 'unresolved'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-zinc-500 hover:bg-brand-cream/30 hover:text-brand-emerald'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          تحت البحث والحل ({queries.filter((q) => !q.isResolved).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            filter === 'resolved'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'text-zinc-500 hover:bg-brand-cream/30 hover:text-brand-emerald'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          تم حلها ({queries.filter((q) => q.isResolved).length})
        </button>
      </div>

      {/* Query list display */}
      <div className="space-y-4">
        {filteredQueries.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-zinc-200 rounded-2xl">
            <HelpCircle className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-500">لا توجد استشكالات علمية مطابقة للتصفية حالياً.</p>
            <p className="text-xs text-zinc-400 mt-1">اضغط على زر الإضافة لتسجيل إشكال أو لبس علمي تبحث عن تحقيقه.</p>
          </div>
        ) : (
          filteredQueries.map((q) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden custom-shadow hover:border-brand-cream/60 transition-all text-right"
            >
              {/* Header card info */}
              <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${
                q.isResolved ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/10 border-red-50'
              }`}>
                <div className="flex items-center gap-2">
                  {q.isResolved ? (
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>تم الحل والحمد لله</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>قيد البحث والمراجعة</span>
                    </div>
                  )}

                  {q.source && (
                    <span className="text-xs text-zinc-500 font-sans truncate max-w-[180px] sm:max-w-xs">
                      الموضع: <span className="font-bold text-brand-emerald">{q.source}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 font-sans hidden sm:inline-block bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">{formatToHijriAndGregorian(q.date)}</span>
                  {/* Toggle resolve button */}
                  <button
                    onClick={() => {
                      if (!q.isResolved) {
                        setSolvingQueryId(q.id);
                        setInlineResolution('');
                      } else {
                        toggleResolveStatus(q);
                      }
                    }}
                    className={`p-1.5 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer ${
                      q.isResolved ? 'text-emerald-600' : 'text-zinc-400 hover:text-emerald-600'
                    }`}
                    title={q.isResolved ? 'إعادة فتح الاستشكال' : 'كتابة تحقيق علمي لحل الاستشكال'}
                  >
                    {q.isResolved ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  {/* Edit button */}
                  <button
                    onClick={() => openEditForm(q)}
                    className="p-1.5 text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteId(q.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer"
                    title="حذف الاستشكال"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card body content */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-brand-emerald-dark font-sans leading-snug">
                    {q.title}
                  </h4>
                  <p className="text-sm text-zinc-700 leading-relaxed font-serif whitespace-pre-line">
                    {q.content}
                  </p>
                </div>

                {/* Direct Solve button if not resolved */}
                {!q.isResolved && solvingQueryId !== q.id && (
                  <div className="pt-2 border-t border-zinc-100 flex justify-end">
                    <button
                      onClick={() => {
                        setSolvingQueryId(q.id);
                        setInlineResolution('');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-brand-gold-light" />
                      <span>حل الاستشكال وتدوين التحقيق العلمي</span>
                    </button>
                  </div>
                )}

                {/* Inline resolve form */}
                {solvingQueryId === q.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        التحقيق العلمي وحل الإشكال المعتمد
                      </h5>
                      <button
                        onClick={() => setSolvingQueryId(null)}
                        className="text-zinc-400 hover:text-zinc-600 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={inlineResolution}
                        onChange={(e) => setInlineResolution(e.target.value)}
                        placeholder="اكتب هنا التحقيق وجواب أهل العلم والنتيجة التي انشرح صدرك لها وحلت الإشكال..."
                        rows={3}
                        className="w-full pl-11 pr-3 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-serif text-xs text-zinc-800 bg-white leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={startVoiceInputForResolution}
                        className={`absolute left-3 top-2.5 p-1 rounded-lg transition-all cursor-pointer ${
                          isListeningResolution 
                            ? 'text-red-600 bg-red-50 animate-pulse ring-2 ring-red-200' 
                            : 'text-zinc-400 hover:text-brand-emerald hover:bg-zinc-100'
                        }`}
                        title="إدخال صوتي باللغة العربية"
                      >
                        {isListeningResolution ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSolvingQueryId(null)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-all"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleSaveInlineResolution(q)}
                        className="px-4 py-1.5 bg-brand-emerald hover:bg-brand-emerald-light text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ واعتماد الحل</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Display resolution box if solved */}
                {q.isResolved && q.resolution && (
                  <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 text-right space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5 font-sans">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        التحقيق والمخرج العلمي المعتمد:
                      </h5>
                      <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-serif whitespace-pre-line">
                        {q.resolution}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-emerald-100/40 gap-2">
                      <button
                        onClick={() => onConvertToBenefit(q)}
                        className="px-3 py-2 bg-gradient-to-r from-brand-emerald to-brand-emerald-dark hover:from-brand-emerald-light hover:to-brand-emerald text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow active:scale-95 cursor-pointer"
                        title="إدراج هذا التحقيق العلمي كفائدة مستقلة في السجل الرئيسي"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-gold-light animate-pulse" />
                        <span>إضافته كفائدة 📚</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-right font-sans border border-brand-cream/60"
            >
              <h4 className="text-base font-bold text-zinc-800 mb-2">تأكيد حذف الاستشكال العلمي</h4>
              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                هل أنت متأكد تماماً من رغبتك في حذف هذا الاستشكال العلمي؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 rounded-xl transition-all"
                >
                  إلغاء التراجع
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                >
                  نعم، احذف الاستشكال
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
