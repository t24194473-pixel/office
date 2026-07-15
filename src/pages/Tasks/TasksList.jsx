import { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronDown, Calendar as CalendarIcon, Scale, Users, CheckCircle, XCircle, AlertTriangle, PlayCircle, Plus, Search, X, Check, Save, List, Layers, Columns, Edit2, Trash2 } from 'lucide-react';
import { getWeekId, addWeeks, formatWeekRange } from '../../utils/dateUtils';

// Status icons & colors mapping
const STATUS_CONFIG = {
  not_executed: { label: 'لم تنفذ', icon: PlayCircle, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-500/20 border-slate-300 dark:border-slate-500/40' },
  completed:    { label: 'مكتملة', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20' },
  late:         { label: 'متأخرة', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
  canceled:     { label: 'ملغاة', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' }
};

const WEEK_DAYS = [
  { value: 0, label: 'السبت' },
  { value: 1, label: 'الأحد' },
  { value: 2, label: 'الاثنين' },
  { value: 3, label: 'الثلاثاء' },
  { value: 4, label: 'الأربعاء' },
  { value: 5, label: 'الخميس' }
];

/* ═══════════════════════════════════════════
   Components (ComboBoxes)
═══════════════════════════════════════════ */
function MultiSelectField({ label, options, values, onChange, required, maxSelections = 2, hideLabel = false, size = 'default', placeholder = 'اختر محامي (2 كحد أقصى)...', customDisplayLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (values.includes(val)) onChange(values.filter(v => v !== val));
    else if (values.length < maxSelections) onChange([...values, val]);
  };

  const getDisplayLabel = () => {
    if (customDisplayLabel) return customDisplayLabel(values, options);
    if (values.length === 0) return placeholder;
    if (values.length === 1) return options.find(o => o.value === values[0])?.label;
    if (values.length === 2) return `تم اختيار محاميين (2)`;
    return `${values.length} محامين`;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {!hideLabel && (
        <label className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">
          {label} {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`flex items-center focus:outline-none w-full text-right transition-all ${size === 'minimal' ? 'bg-transparent text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-700' : size === 'sm' ? 'bg-gray-50 dark:bg-gray-900/50 shadow-sm border border-gray-200 hover:border-orange-400 dark:border-gray-700 dark:hover:border-orange-500 rounded-xl focus:ring-2 focus:ring-orange-500/20 px-3 py-1.5 text-xs text-gray-900 dark:text-white justify-between' : 'bg-gray-50 dark:bg-gray-900/50 shadow-sm border border-gray-200 hover:border-orange-400 dark:border-gray-700 dark:hover:border-orange-500 rounded-xl focus:ring-2 focus:ring-orange-500/20 px-4 py-2.5 text-sm text-gray-900 dark:text-white justify-between'}`}>
        <span className={values.length > 0 ? (size === 'minimal' ? 'font-bold' : '') : 'text-gray-400 truncate'}>{getDisplayLabel()}</span>
        <div className={`flex items-center gap-2 shrink-0 ${size === 'minimal' ? 'mr-1' : ''}`}>
            {values.length > 0 && size !== 'minimal' && <span className="bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full font-bold text-orange-700 dark:text-orange-300 text-xs">{values.length}/{maxSelections}</span>}
            {size !== 'minimal' && <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${isOpen ? '-rotate-90 text-orange-500' : 'rotate-90'}`} />}
        </div>
      </button>

      {isOpen && (
        <div className={`z-20 absolute bg-white dark:bg-gray-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] mt-2 border border-gray-100 dark:border-gray-700 rounded-xl w-full ${size === 'minimal' ? 'min-w-[180px] right-0' : ''} min-h-[150px]`}>
          <div className="py-1.5 max-h-56 overflow-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">لا يوجد محامين متاحين</div>
            ) : options.map((opt, idx) => {
                const isSelected = values.includes(opt.value);
                const isDisabled = !isSelected && values.length >= maxSelections;
                return (
                  <button key={idx} type="button" disabled={isDisabled} onClick={() => handleSelect(opt.value)}
                    className={`w-full text-right px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${isSelected ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-bold' : isDisabled ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    {opt.label}
                    {isSelected && <Check size={16} className="text-orange-600 dark:text-orange-400" />}
                  </button>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableCaseSelect({ cases, value, onChange, required, hideLabel = false, size = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return cases;
    const lower = search.toLowerCase();
    return cases.filter(c => c.title?.toLowerCase().includes(lower) || c.clientName?.toLowerCase().includes(lower) || c.opponentName?.toLowerCase().includes(lower));
  }, [cases, search]);

  const selectedCase = cases.find(c => c.id === value);

  return (
    <div className="relative" ref={wrapperRef}>
      {!hideLabel && (
        <label className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">
          أرفق المهمة بقضية {required && <span className="text-orange-500">*</span>}
        </label>
      )}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shadow-sm border border-gray-200 hover:border-orange-400 dark:border-gray-700 dark:hover:border-orange-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-right transition-all ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}>
        <span className={selectedCase ? 'font-bold' : 'text-gray-400 truncate max-w-[90%]'}>
          {selectedCase ? `${selectedCase.title} - ${selectedCase.clientName}` : 'ابحث عن القضية...'}
        </span>
        <ChevronRight size={16} className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? '-rotate-90 text-orange-500' : 'rotate-90'}`} />
      </button>

      {isOpen && (
        <div className="z-30 absolute flex flex-col bg-white dark:bg-gray-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] mt-2 border border-gray-100 dark:border-gray-700 rounded-xl w-full max-h-72">
          <div className="p-2 border-gray-100 dark:border-gray-700 border-b">
            <div className="relative">
              <Search size={16} className="top-1/2 right-2.5 absolute text-gray-400 -translate-y-1/2" />
              <input type="text" placeholder="رقم القضية، موكل، خصم..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-gray-50 dark:bg-gray-900 py-2 pr-8 pl-3 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:outline-none focus:ring-1 focus:ring-orange-500 w-full text-gray-900 dark:text-white text-sm" autoFocus />
            </div>
          </div>
          <div className="p-1 min-h-[100px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
               <div className="p-3 text-gray-500 text-xs text-center">لا توجد قضايا مطابقة</div>
            ) : filtered.map(c => (
                 <button key={c.id} type="button" onClick={() => { onChange(c.id); setIsOpen(false); setSearch(''); }}
                   className={`w-full text-right p-3 rounded-lg text-sm transition-colors hover:bg-orange-50 dark:hover:bg-orange-500/10 ${value === c.id ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-500' : 'text-gray-700 dark:text-gray-200'}`}>
                   <div className="font-bold">{c.title}</div>
                   <div className="mt-0.5 text-[11px] text-gray-500">موكل: {c.clientName}</div>
                 </button>
               ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Inline Lawyer Editor
═══════════════════════════════════════════ */
function InlineTaskLawyerEditor({ task, usersOptions, onTaskUpdated }) {
  const [updating, setUpdating] = useState(false);

  const handleLawyersChange = async (newUids) => {
    setUpdating(true);
    try {
      const selectedLawyersData = newUids.map(uid => {
        const u = usersOptions.find(opt => opt.value === uid);
        return { uid, name: u?.label || 'محامي' };
      });
      await updateDoc(doc(db, 'tasks', task.id), { assignedLawyers: selectedLawyersData });
      onTaskUpdated({ ...task, assignedLawyers: selectedLawyersData });
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء تعيين المحامين');
    } finally {
      setUpdating(false);
    }
  };

  const currentUids = task.assignedLawyers?.map(l => l.uid) || [];

  return (
    <div className="relative inline-flex items-center group/lawyereditor shrink-0">
      <MultiSelectField 
        label="" 
        hideLabel={true}
        size="minimal"
        options={usersOptions}
        values={currentUids}
        onChange={handleLawyersChange}
        placeholder="إسناد محامي..."
        customDisplayLabel={(vals, opts) => {
          if (vals.length === 0) return <span className="text-gray-400 flex items-center gap-1">إسناد لمحامي... <Edit2 size={12} className="opacity-0 group-hover/lawyereditor:opacity-100 transition-opacity" /></span>;
          const names = vals.map(v => opts.find(o => o.value === v)?.label).join(' ، ');
          return (
            <span className="flex items-center gap-1.5">
              <Users size={14} className="shrink-0 text-orange-600"/> 
              <span className="truncate">{names}</span>
              <Edit2 size={12} className="shrink-0 text-gray-400 opacity-0 group-hover/lawyereditor:opacity-100 transition-opacity" />
            </span>
          );
        }}
      />
      {updating && <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 flex items-center justify-center rounded-lg z-10"><div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Inline Field Editor (Title & Description)
═══════════════════════════════════════════ */
function InlineTaskFieldEditor({ task, fieldName, value, placeholder, textClassName, inputClassName = '', multiline = false, saveOnEnter = false, onTaskUpdated, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    const trimmedVal = val.trim();
    if (trimmedVal === (value || '').trim()) {
      setVal(value || '');
      return;
    }
    
    if (fieldName === 'title' && !trimmedVal) {
      alert('يجب أن تحتوي المهمة على عنوان');
      setVal(value || ''); // revert
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), { [fieldName]: trimmedVal });
      onTaskUpdated({ ...task, [fieldName]: trimmedVal });
    } catch (e) {
      console.error(e);
      alert('خطأ أثناء الحفظ');
      setVal(value || '');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (!multiline || saveOnEnter) {
        e.preventDefault();
        handleSave();
      }
    }
    if (e.key === 'Escape') { setVal(value || ''); setIsEditing(false); }
  };

  if (isEditing && !disabled) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`w-full bg-white dark:bg-gray-800 border-2 border-orange-500 rounded-md px-2 py-1 outline-none shadow-sm min-w-[200px] resize-none overflow-hidden ${inputClassName ? inputClassName : 'text-xs font-semibold'}`}
          rows={2}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = (e.target.scrollHeight) + "px";
          }}
          placeholder={placeholder}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`flex-1 min-w-[150px] w-full bg-white dark:bg-gray-800 border-2 border-orange-500 rounded-md px-2 py-0.5 outline-none shadow-sm font-black text-gray-900 dark:text-white leading-tight ${inputClassName ? inputClassName : 'text-base sm:text-[17px]'}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div 
      onClick={(e) => { if (disabled) return; e.preventDefault(); e.stopPropagation(); setIsEditing(true); }} 
      className={`relative flex items-start gap-1 w-full min-w-0 max-w-full ${disabled ? '' : 'cursor-text group/edit leading-none'}`}
    >
      {saving && <span className="absolute -top-4 right-0 bg-orange-50 px-1 py-0.5 rounded text-[10px] text-orange-600 animate-pulse whitespace-nowrap">حفظ...</span>}
      <span className={`flex-1 min-w-0 ${textClassName}`}>
        {value ? (multiline ? `- ${value}` : value) : <span className="text-gray-400 font-normal pr-1 leading-normal opacity-70">{placeholder}</span>}
      </span>
      {!disabled && (
        <Edit2 size={12} className={`opacity-0 group-hover/edit:opacity-100 transition-opacity text-gray-400 shrink-0 mt-1 ${multiline ? 'ml-1' : 'ml-2'}`} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Inline Add Task Row
═══════════════════════════════════════════ */
function InlineAddTaskRow({ weekId, dayOffset, cases, users, onTaskAdded, user }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', caseId: '', assignedLawyersUids: [] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.caseId) {
      alert('الرجاء كتابة العنوان واختيار قضية.');
      return;
    }
    setLoading(true);
    try {
      const selectedLawyersData = form.assignedLawyersUids.map(uid => {
        const u = users.find(opt => opt.value === uid);
        return { uid, name: u?.label || 'محامي' };
      });
      const selectedCase = cases.find(c => c.id === form.caseId);
      const dueDateObj = new Date(weekId + 'T00:00:00');
      dueDateObj.setDate(dueDateObj.getDate() + dayOffset);
      dueDateObj.setHours(23, 59, 59, 999);

      const taskData = {
        title: form.title.trim(),
        description: '', 
        caseId: form.caseId,
        caseTitle: selectedCase ? `${selectedCase.title} - ${selectedCase.clientName}` : '',
        assignedLawyers: selectedLawyersData,
        dueDate: dueDateObj.toISOString(),
        weekIndex: weekId,
        status: 'not_executed',
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
      };

      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      onTaskAdded({ id: docRef.id, ...taskData });
      setForm({ title: '', caseId: '', assignedLawyersUids: [] });
    } catch (e) {
      alert(`خطأ أثناء الحفظ: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50/50 dark:bg-gray-900/40 p-2 sm:p-3 mt-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 mx-3 sm:mx-4 mb-4">
       <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-3 lg:items-center w-full">
         <div className="flex-1 w-full lg:min-w-[150px]">
           <input
              required type="text"
              placeholder='+ عنوان المهمة السريعة...'
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 w-full text-xs px-3 py-2 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
            />
         </div>
         <div className="flex-1 w-full lg:max-w-[220px]">
            <SearchableCaseSelect 
              cases={cases} 
              value={form.caseId} 
              onChange={val => setForm({...form, caseId: val})} 
              required 
              hideLabel={true}
              size="sm"
            />
         </div>
         <div className="flex-1 w-full lg:max-w-[250px]">
              <MultiSelectField 
                label="" 
                hideLabel={true}
                size="sm"
                options={users}
                values={form.assignedLawyersUids}
                onChange={(vals) => setForm({...form, assignedLawyersUids: vals})}
              />
         </div>
         <button type="submit" disabled={loading} className="shrink-0 bg-transparent hover:bg-orange-600 border border-orange-500 dark:border-orange-500 text-orange-600 hover:text-white disabled:opacity-70 rounded-xl px-4 py-1.5 flex justify-center items-center font-bold text-xs transition-all h-[34px]">
            {loading ? <div className="border-2 border-current border-t-transparent flex rounded-full w-4 h-4 animate-spin"/> : 'إضافة'}
         </button>
       </form>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Modals
═══════════════════════════════════════════ */
function TaskModal({ isOpen, onClose, weekId, defaultDayOffset, cases, users, onTaskAdded, onTaskUpdated, user, editTask }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    caseId: editTask?.caseId || '',
    assignedLawyersUids: editTask?.assignedLawyers?.map(l => l.uid) || [],
    dueDayOffset: editTask ? (editTask.dueDayOffset ?? 0) : (typeof defaultDayOffset === 'number' ? defaultDayOffset : 0),
  });

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line
      setForm({
        title: editTask?.title || '',
        description: editTask?.description || '',
        caseId: editTask?.caseId || '',
        assignedLawyersUids: editTask?.assignedLawyers?.map(l => l.uid) || [],
        dueDayOffset: editTask ? (editTask.dueDayOffset ?? 0) : (typeof defaultDayOffset === 'number' ? defaultDayOffset : 0),
      });
    }
  }, [isOpen, defaultDayOffset, editTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.caseId) {
      alert('الرجاء كتابة العنوان واختيار قضية.');
      return;
    }

    setLoading(true);
    try {
      const selectedLawyersData = form.assignedLawyersUids.map(uid => {
        const u = users.find(opt => opt.value === uid);
        return { uid, name: u?.label || 'محامي' };
      });

      const selectedCase = cases.find(c => c.id === form.caseId);

      const dueDateObj = new Date(weekId + 'T00:00:00');
      dueDateObj.setDate(dueDateObj.getDate() + form.dueDayOffset);
      dueDateObj.setHours(23, 59, 59, 999);
      if (editTask) {
        const updatedTaskData = {
          title: form.title.trim(),
          description: form.description.trim(),
          caseId: form.caseId,
          caseTitle: selectedCase ? `${selectedCase.title} - ${selectedCase.clientName}` : '',
          assignedLawyers: selectedLawyersData,
          dueDate: dueDateObj.toISOString()
        };
        await updateDoc(doc(db, 'tasks', editTask.id), updatedTaskData);
        onTaskUpdated({ ...editTask, ...updatedTaskData });
      } else {
        const taskData = {
          title: form.title.trim(),
          description: form.description.trim(),
          caseId: form.caseId,
          caseTitle: selectedCase ? `${selectedCase.title} - ${selectedCase.clientName}` : '',
          assignedLawyers: selectedLawyersData,
          dueDate: dueDateObj.toISOString(),
          weekIndex: weekId,
          status: 'not_executed',
          createdAt: serverTimestamp(),
          createdBy: user?.uid || null,
        };
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        onTaskAdded({ id: docRef.id, ...taskData });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert(`خطأ أثناء الحفظ: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white dark:bg-gray-800 shadow-xl rounded-2xl w-full max-w-lg overflow-visible">
        <div className="flex justify-between items-center p-5 border-gray-100 dark:border-gray-700 border-b">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">{editTask ? 'تعديل المهمة' : 'مهمة جديدة لمتطلبات الأسبوع'}</h2>
          <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          <SearchableCaseSelect cases={cases} value={form.caseId} onChange={(val) => setForm({...form, caseId: val})} required />
          
          {(!editTask && typeof defaultDayOffset !== 'number') && (
            <div>
              <label className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">التسليم يوم <span className="text-orange-500">*</span></label>
              <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900/30 p-2 border border-gray-100 dark:border-gray-800 rounded-xl">
                {WEEK_DAYS.map(day => (
                  <button 
                    key={`day-${day.value}`}
                    type="button"
                    onClick={() => setForm({...form, dueDayOffset: day.value})}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 text-center min-w-[50px] ${form.dueDayOffset === day.value ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 scale-105 border-orange-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500'}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">
              تفاصيل المهمة <span className="text-orange-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="مثال: تقديم المذكرة للدائرة..."
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl outline-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full text-gray-900 dark:text-white text-sm transition-all"
            />
          </div>

          <MultiSelectField 
            label="فريق العمل الموكل بالمهمة" 
            options={users}
            values={form.assignedLawyersUids}
            onChange={(vals) => setForm({...form, assignedLawyersUids: vals})}
          />

          <div>
            <label className="block mb-1.5 font-medium text-gray-700 dark:text-gray-300 text-sm">وصف فرعي (اختياري)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 border border-gray-200 focus:border-orange-500 dark:border-gray-700 rounded-xl outline-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full min-h-[60px] text-gray-900 dark:text-white text-sm transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700 px-5 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-300 text-sm transition-colors">إلغاء</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-linear-to-l from-orange-600 hover:from-orange-700 to-orange-500 hover:to-orange-600 disabled:opacity-60 shadow-orange-600/20 shadow-sm px-6 py-2 rounded-xl font-bold text-white text-sm transition-all">
              {loading ? 'جاري الحفظ...' : <><Save size={16}/> إضافة وإسناد</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   الصفحة الرئيسية: لوحة المهام الأسبوعية
═══════════════════════════════════════════ */
export default function TasksList() {
  const { user } = useAuthStore();
  
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'tabs'; // Tabs mode is now perfectly optimized for mobile (horizontal scroll bar)
    }
    return localStorage.getItem('tasksViewModeV2') || 'tabs';
  });
  
  useEffect(() => { 
    localStorage.setItem('tasksViewModeV2', viewMode); 
  }, [viewMode]);

  useEffect(() => {
    const handleResize = () => {
      // Force 'tabs' mode on mobile as the user requested horizontal tabs
      if (window.innerWidth < 1024 && viewMode !== 'tabs') {
        setViewMode('tabs');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const [selectedTabDay, setSelectedTabDay] = useState(0);

  const [currentDate, setCurrentDate] = useState(new Date());
  const weekId = getWeekId(currentDate);
  const weekLabel = formatWeekRange(currentDate);

  const getWeekNameOfMonth = (date) => {
    const month = date.toLocaleString('ar-EG', { month: 'long' });
    const year = date.getFullYear();
    const day = date.getDate();
    let weekStr;
    if (day <= 7) weekStr = "الأسبوع الأول";
    else if (day <= 14) weekStr = "الأسبوع الثاني";
    else if (day <= 21) weekStr = "الأسبوع الثالث";
    else if (day <= 28) weekStr = "الأسبوع الرابع";
    else weekStr = "الأسبوع الأخير";
    return `${weekStr} من شهر ${month} ${year}`;
  };

  const relativeWeekBadge = useMemo(() => {
    const currentStart = new Date(weekId + 'T00:00:00').getTime();
    
    // get start of today's week
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    now.setDate(now.getDate() - now.getDay()); // Sunday
    const todayStart = now.getTime();

    const diffWeeks = Math.round((currentStart - todayStart) / (1000 * 60 * 60 * 24 * 7));

    if (diffWeeks === 0) return { text: 'هذا الأسبوع', classes: 'bg-orange-600 text-white shadow-sm font-black' };
    if (diffWeeks === 1) return { text: 'الأسبوع القادم', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800' };
    if (diffWeeks === -1) return { text: 'الأسبوع الماضي', classes: 'bg-gray-200/80 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-600' };
    if (diffWeeks > 1) return { text: `بعد ${diffWeeks} أسابيع`, classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800' };
    if (diffWeeks < -1) return { text: `منذ ${Math.abs(diffWeeks)} أسابيع`, classes: 'bg-gray-100/50 text-gray-500 dark:bg-gray-800 dark:text-gray-500 font-bold border border-gray-200 dark:border-gray-700' };
    return null;
  }, [weekId]);

  const [allCases, setAllCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [usersOptions, setUsersOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Modals & Accordion state
  const [addTaskDayOffset, setAddTaskDayOffset] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedDays, setExpandedDays] = useState([]); // جميع الأيام مغلقة افتراضياً

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'tasks', taskToDelete.id));
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
    } catch (error) {
      console.error(error);
      alert('خطأ أثناء حذف المهمة');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleDayExpanded = (dayVal) => {
    setExpandedDays(prev => {
      const isCurrentlyExpanded = prev.includes(dayVal);
      // Auto-scroll smoothly to the accordion if it is being opened
      if (!isCurrentlyExpanded) {
        setTimeout(() => {
          const element = document.getElementById(`day-accordion-${dayVal}`);
          if (element) {
            const yOffset = -90; // Adjust for top navigation bar height
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 200); // Wait for the accordion CSS transition to begin
      }
      return isCurrentlyExpanded ? prev.filter(v => v !== dayVal) : [...prev, dayVal];
    });
  };

  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('status', '==', 'approved'))).then(snap => {
      setUsersOptions(snap.docs.map(d => ({ value: d.data().uid, label: d.data().name || d.data().email })));
    }).catch(console.error);

    getDocs(query(collection(db, 'cases'), orderBy('createdAt', 'desc'))).then(snap => {
      setAllCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'tasks'), where('weekIndex', '==', weekId)));
        if (!cancelled) setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [weekId]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const updateData = { status: newStatus };
      if (newStatus === 'completed' || newStatus === 'late') updateData.completedAt = serverTimestamp();
      await updateDoc(taskRef, updateData);
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updateData, completedAt: (newStatus === 'completed' || newStatus === 'late') ? Timestamp.now() : t.completedAt } : t));
    } catch (error) {
      console.error(error);
      alert('خطأ في تحديث الحالة');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const computeDayData = () => {
    // Group tasks by their exact due day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysData = WEEK_DAYS.map(dayObj => {
      const dateObj = new Date(weekId + 'T00:00:00');
      dateObj.setDate(dateObj.getDate() + dayObj.value);
      dateObj.setHours(0, 0, 0, 0); 
      return { ...dayObj, dateObj, isPastDay: dateObj < today, tasks: [] };
    });

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const tDue = new Date(task.dueDate);
      const mappedValue = (tDue.getDay() + 1) % 7;
      
      const targetDay = daysData.find(d => d.value === mappedValue);
      if (targetDay) {
        let effectiveStatus = task.status;
        // Dynamically evaluate late tasks purely for UI
        if (targetDay.isPastDay && !['completed', 'canceled'].includes(task.status)) {
            effectiveStatus = 'late';
        }
        targetDay.tasks.push({ ...task, effectiveStatus });
      }
    });

    return daysData;
  };

  const daysGrid = computeDayData();

  return (
    <div className="lg:z-50 lg:fixed lg:inset-0 lg:bg-gray-50 dark:lg:bg-gray-900 lg:p-4 lg:overflow-y-auto transition-colors duration-300">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-0 pb-20 w-full">
      
        {/* Title and Top Actions - Hidden on mobile to save vertical space */}
        <div className="hidden sm:flex flex-row justify-between items-center gap-3 mb-3">
          <h1 className="font-bold text-gray-900 dark:text-white text-xl transition-colors">توزيع المهام اليومي</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden lg:flex bg-gray-200/50 dark:bg-gray-800 rounded-lg p-1 mr-2 border border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setViewMode('accordion')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'accordion' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600 dark:text-orange-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="عرض طي الأيام"
              >
                <Layers size={14} />
              </button>
              <button 
                onClick={() => setViewMode('flat')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'flat' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600 dark:text-orange-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="عرض القائمة المستمرة"
              >
                <List size={14} />
              </button>
              <button 
                onClick={() => setViewMode('tabs')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'tabs' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600 dark:text-orange-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="عرض القائمة الجانبية"
              >
                <Columns size={14} />
              </button>
            </div>

            <Link to="/" className="hidden lg:flex items-center gap-1.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-sm px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-xs transition-all">
              <ChevronRight size={14} /> لوحة القيادة
            </Link>
            <button onClick={() => setAddTaskDayOffset('general')} className="flex items-center gap-1.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 shadow-sm px-3 py-1.5 rounded-lg font-bold text-xs text-white dark:text-gray-900 active:scale-95 transition-all">
              <Plus size={14} /> إسناد مهمة
            </button>
          </div>
        </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm mb-6 px-2 sm:px-4 py-3 border border-gray-100 dark:border-gray-700/80 rounded-2xl">
        <button onClick={() => setCurrentDate(prev => addWeeks(prev, -1))} className="group flex items-center justify-center gap-2 bg-gray-50/80 hover:bg-orange-50 dark:bg-gray-900/40 dark:hover:bg-orange-500/10 active:scale-95 transition-all text-gray-600 dark:text-gray-400 hover:text-orange-700 dark:hover:text-orange-400 font-bold px-3 py-2 sm:px-4 sm:py-2 rounded-xl border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-500/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="bg-white dark:bg-gray-800 shadow-xs p-1 rounded-md text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"><ChevronRight size={18} /></div>
          <span className="hidden sm:inline text-[11px] sm:text-xs">الأسبوع الماضي</span>
        </button>

        <div className="flex flex-col items-center gap-1.5 px-2 text-center">
          <div className="flex flex-col items-center gap-1">
             <div className="flex flex-wrap justify-center items-center gap-2">
               <span className="font-black text-gray-900 dark:text-white text-base sm:text-[17px] transition-all">{getWeekNameOfMonth(currentDate)}</span>
               {relativeWeekBadge && (
                 <span className={`text-[10px] px-1.5 py-0.5 rounded shadow-xs ${relativeWeekBadge.classes}`}>
                   {relativeWeekBadge.text}
                 </span>
               )}
             </div>
             <span className="font-semibold text-[10px] sm:text-xs text-gray-400 tracking-wider bg-gray-50 dark:bg-gray-900/30 px-3 py-0.5 rounded-full shadow-inner">{weekLabel}</span>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="bg-orange-50 dark:bg-orange-500/10 mt-1 px-4 py-1 rounded-full font-bold text-[10px] sm:text-[11px] text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-700 dark:text-orange-400 transition-all shadow-xs hover:shadow-sm active:scale-95">
            العودة للأسبوع الحالي
          </button>
        </div>

        <button onClick={() => setCurrentDate(prev => addWeeks(prev, 1))} className="group flex flex-row-reverse items-center justify-center gap-2 bg-gray-50/80 hover:bg-orange-50 dark:bg-gray-900/40 dark:hover:bg-orange-500/10 active:scale-95 transition-all text-gray-600 dark:text-gray-400 hover:text-orange-700 dark:hover:text-orange-400 font-bold px-3 py-2 sm:px-4 sm:py-2 rounded-xl border-2 border-transparent hover:border-orange-200 dark:hover:border-orange-500/30 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="bg-white dark:bg-gray-800 shadow-xs p-1 rounded-md text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors"><ChevronLeft size={18} /></div>
          <span className="hidden sm:inline text-[11px] sm:text-xs">الأسبوع القادم</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="border-4 border-orange-500 border-t-transparent rounded-full w-10 h-10 animate-spin" />
        </div>
      ) : (
        <div className={viewMode === 'tabs' ? "flex flex-col lg:flex-row gap-6 items-start" : "flex flex-col gap-6"}>
          {viewMode === 'tabs' && (
            <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible overflow-y-hidden custom-scrollbar gap-1 sm:gap-2 lg:gap-1.5 p-1.5 sm:p-2 bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-xl lg:rounded-2xl lg:sticky lg:top-24 mb-1 lg:mb-0">
              <button 
                onClick={() => setSelectedTabDay('all')}
                className={`flex items-center justify-center lg:justify-between whitespace-nowrap shrink-0 lg:w-full px-3 py-1.5 sm:px-4 sm:py-2.5 lg:p-3 rounded-lg lg:rounded-xl transition-all font-bold text-xs sm:text-sm select-none border ${selectedTabDay === 'all' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm border-orange-100 dark:border-orange-500/30 ring-1 ring-orange-500/20 lg:ring-0' : 'bg-white dark:bg-gray-800 lg:bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700/50'}`}
              >
                <span className="lg:hidden">الكل</span>
                <span className="hidden lg:inline">كل الأيام</span>
              </button>
              <div className="hidden lg:block h-px w-full bg-gray-200 dark:bg-gray-700/50 my-1"></div>
              {daysGrid.map(d => {
                const isSelected = selectedTabDay === d.value;
                const dCompleted = d.tasks.filter(t => t.effectiveStatus === 'completed').length;
                return (
                  <button 
                    key={d.value}
                    onClick={() => setSelectedTabDay(d.value)}
                    className={`flex items-center justify-center lg:justify-between whitespace-nowrap shrink-0 lg:w-full px-2.5 py-1.5 sm:px-4 sm:py-2.5 lg:p-3 rounded-lg lg:rounded-xl transition-all select-none border gap-1.5 sm:gap-2 ${isSelected ? 'bg-white dark:bg-gray-800 shadow-sm border-orange-200 dark:border-orange-500/30 ring-1 ring-orange-500/20 lg:ring-0' : 'bg-white dark:bg-gray-800 lg:bg-transparent hover:bg-white/50 dark:hover:bg-gray-800/50 border-gray-100 dark:border-gray-700/50'}`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                       <span className={`font-bold text-xs sm:text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'} ${d.isPastDay && 'opacity-60'}`}>{d.label}</span>
                       {d.isPastDay && <span className="hidden sm:inline bg-gray-200/70 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-[9px] text-gray-500">منقضي</span>}
                    </div>
                    {d.tasks.length > 0 && (
                      <span className={`hidden lg:inline flex-[0_0_auto] text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${isSelected ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'}`}>
                        {dCompleted}/{d.tasks.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          {(viewMode === 'tabs' ? daysGrid.filter(d => selectedTabDay === 'all' || selectedTabDay === d.value) : daysGrid).map(dayItem => {
            const dateStr = dayItem.dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            const isAccordion = viewMode === 'accordion';
            const isExpanded = !isAccordion || expandedDays.includes(dayItem.value);
            
            // حساب إحصائيات المحامين لهذا اليوم
            const lawyerSummary = {};
            dayItem.tasks.forEach(task => {
              if (task.assignedLawyers) {
                task.assignedLawyers.forEach(lawyer => {
                  lawyerSummary[lawyer.name] = (lawyerSummary[lawyer.name] || 0) + 1;
                });
              }
            });
            const lawyerStats = Object.entries(lawyerSummary);
            
            const completedTasksCount = dayItem.tasks.filter(t => t.effectiveStatus === 'completed').length;
            const progressPercent = dayItem.tasks.length === 0 ? 0 : Math.round((completedTasksCount / dayItem.tasks.length) * 100);

            return (
              <div key={dayItem.value} id={`day-${dayItem.value}`} className={
                isAccordion 
                  ? `border rounded-2xl overflow-hidden transition-all duration-300 ${dayItem.isPastDay && !isExpanded ? 'bg-gray-50/60 dark:bg-gray-900 opacity-80' : 'bg-white dark:bg-gray-800'} ${isExpanded ? 'ring-1 ring-orange-400 dark:ring-orange-500/50 border-orange-400 dark:border-orange-500/50 my-2 shadow-md opacity-100' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'}`
                  : `mb-2`
              }>
                {/* ─── هيدر اليوم ─── */}
                <div 
                  role={isAccordion ? "button" : "presentation"}
                  tabIndex={isAccordion ? 0 : -1}
                  onClick={() => isAccordion && toggleDayExpanded(dayItem.value)}
                  onKeyDown={(e) => { if (isAccordion && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleDayExpanded(dayItem.value); } }}
                  className={
                    isAccordion
                      ? `w-full cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors duration-200 ${isExpanded ? 'bg-orange-50/30 dark:bg-orange-500/10' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`
                      : `w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 pt-2 pb-1 mb-1 bg-transparent border-b-2 border-gray-100 dark:border-gray-800`
                  }
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full min-w-0">
                    <div className={`mt-0.5 sm:mt-0 p-2 sm:p-2.5 rounded-xl flex items-center justify-center transition-colors shrink-0 ${isExpanded ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                      <CalendarIcon size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 py-0.5 w-full min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <h2 className={`text-lg sm:text-xl font-bold whitespace-nowrap ${dayItem.isPastDay && !isExpanded ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          يوم {dayItem.label}
                        </h2>
                        {dayItem.isPastDay && <span className="bg-gray-200/70 dark:bg-gray-800 shadow-sm px-2 py-0.5 rounded-full font-bold text-[10px] text-gray-500 dark:text-gray-400 truncate">منقضي</span>}
                        <span className="font-medium text-gray-500 text-xs sm:text-sm whitespace-nowrap">{dateStr}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                      {dayItem.tasks.length > 0 && (
                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-500/10 shadow-sm px-2 py-0.5 border border-orange-100 dark:border-orange-500/20 rounded-full">
                          <span className="font-bold text-[10px] sm:text-[11px] text-orange-700 dark:text-orange-400 whitespace-nowrap">
                            {completedTasksCount} / {dayItem.tasks.length} منجزة
                          </span>
                          <div className="hidden sm:block bg-orange-200/60 dark:bg-orange-900/50 rounded-full w-12 sm:w-16 h-1.5 overflow-hidden">
                            <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                          </div>
                        </div>
                      )}
                      
                      {/* ملخص المحامين في حالة الإغلاق مسطح على نفس الصف */}
                      {!isExpanded && lawyerStats.length > 0 && (
                        <>
                          <div className="hidden sm:block bg-gray-300 dark:bg-gray-700 mx-1 w-px h-4"></div>
                          <div className="flex flex-wrap gap-1.5">
                          {lawyerStats.map(([name, count], idx) => (
                            <span key={idx} className="flex items-center gap-1.5 bg-white dark:bg-gray-900 shadow-sm px-2 py-1 border border-gray-200 dark:border-gray-700/80 rounded-lg font-bold text-[10px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              <Users size={12} className="text-gray-400 hidden sm:inline" />
                              {name} <span className="bg-orange-50 dark:bg-gray-800 px-1.5 rounded-md min-w-[18px] text-orange-600 dark:text-orange-400 text-center">{count}</span>
                            </span>
                          ))}
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setAddTaskDayOffset(dayItem.value); }} 
                      className={`flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 shadow-sm active:scale-95 transition-colors text-white font-bold w-full sm:w-auto justify-center ${!isAccordion ? 'py-1 sm:py-1.5 px-3 sm:px-4 text-[11px] sm:text-xs rounded-lg' : 'px-4 py-2 rounded-xl text-xs sm:text-sm'}`}
                    >
                      <Plus size={16} /> <span>أضف مهمة هنا</span>
                    </button>
                    {isAccordion && (
                      <ChevronDown size={22} className={`text-gray-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-orange-500' : ''}`} />
                    )}
                  </div>
                </div>

                <div className={isAccordion ? `grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}` : 'block'}>
                  <div className={`${isAccordion ? 'overflow-hidden bg-white dark:bg-gray-800' : dayItem.tasks.length > 0 ? 'overflow-visible bg-transparent border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-sm' : ''}`}>
                    {dayItem.tasks.length === 0 ? null : (
                    <div className="flex flex-col gap-2 p-2 relative z-10 w-full">
                      {dayItem.tasks.map((task, index) => {
                        const conf = STATUS_CONFIG[task.effectiveStatus] || STATUS_CONFIG.not_executed;
                        const StatusIcon = conf.icon;
                        const relatedCase = allCases.find(c => c.id === task.caseId);
                        
                        return (
                          <div 
                            key={task.id} 
                            className={`group relative hover:z-50 focus-within:z-50 flex flex-col lg:flex-row lg:items-center justify-between border border-gray-100 dark:border-gray-700/60 rounded-2xl ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/70 dark:bg-gray-900/40'} hover:border-orange-200 dark:hover:border-orange-500/30 hover:bg-orange-50/20 dark:hover:bg-gray-800/80 hover:shadow-md transition-all duration-300 gap-3 py-3.5 px-4 shrink-0 shadow-sm`}
                          >
                            
                              <div className="relative flex flex-1 gap-3 sm:gap-4 w-full min-w-0 pt-0.5">
                              {/* الأيقونة بدون حركات مزعجة */}
                              <div className={`mt-0.5 shrink-0 transition-transform group-hover:scale-110 ${conf.color}`}>
                                <StatusIcon size={20} className="stroke-[2.5px]" />
                              </div>

                              <div className="flex flex-col flex-1 gap-2 min-w-0 w-full overflow-hidden">
                                  {/* عنوان المهمة (الحقل الوحيد) قابل للتعديل مباشرة */}
                                  <div className="flex w-full min-w-0 max-w-full">
                                    <InlineTaskFieldEditor
                                      task={task}
                                      fieldName="title"
                                      value={task.title}
                                      multiline={true}
                                      saveOnEnter={true}
                                      disabled={task.effectiveStatus === 'completed' || task.effectiveStatus === 'canceled'}
                                      onTaskUpdated={(t) => setTasks(prev => prev.map(pt => pt.id === t.id ? t : pt))}
                                      inputClassName="font-black text-gray-900 dark:text-white text-base sm:text-[17px] !break-words !whitespace-pre-wrap"
                                      textClassName={`text-base sm:text-[17px] font-black leading-snug break-words break-all whitespace-pre-wrap transition-all duration-300 ${task.effectiveStatus === 'completed' || task.effectiveStatus === 'canceled' ? 'text-gray-400 dark:text-gray-500 line-through opacity-70' : 'text-gray-900 dark:text-white group-hover/edit:text-orange-700 dark:group-hover/edit:text-orange-500'}`}
                                    />
                                  </div>

                                  {/* معلومات القضية كشارات منفصلة (في الأسفل) */}
                                  <div className={`flex items-center flex-wrap gap-2 text-[10px] sm:text-[11px] font-bold transition-opacity duration-300 ${task.effectiveStatus === 'completed' || task.effectiveStatus === 'canceled' ? 'opacity-60 text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                    <Link to={`/cases/${task.caseId}`} className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 hover:text-orange-700 dark:hover:text-orange-400 px-2 py-0.5 rounded-md transition-colors border border-gray-200/50 dark:border-gray-700/50 truncate max-w-[150px] sm:max-w-[250px]">
                                      <Scale size={12} className={task.effectiveStatus === 'completed' || task.effectiveStatus === 'canceled' ? 'text-gray-400 dark:text-gray-500' : 'text-orange-600 dark:text-orange-500'}/>
                                      <span className="truncate">{task.caseTitle}</span>
                                    </Link>
                                    {relatedCase?.caseSubject && (
                                      <span className="bg-gray-100/50 dark:bg-gray-900/50 px-2 py-0.5 rounded-md text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 max-w-[150px] sm:max-w-[200px] truncate">
                                        {relatedCase.caseSubject}
                                      </span>
                                    )}
                                  </div>
                              </div>
                            </div>
                            
                            <div className="relative flex flex-wrap md:flex-nowrap justify-between md:justify-end items-center gap-3 sm:gap-6 mt-3 pt-3 md:mt-0 md:pt-0 w-full md:w-auto shrink-0 border-t border-dashed border-gray-100 dark:border-gray-700/50 md:border-transparent">
                                {/* المحرر المباشر لأسماء المحامين */}
                                <div className="flex-1 min-w-[120px]">
                                  <InlineTaskLawyerEditor 
                                    task={task} 
                                    usersOptions={usersOptions} 
                                    onTaskUpdated={(updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))} 
                                  />
                                </div>
                               
                               {/* قائمة تغيير الحالة وأزرار الإجراءات */}
                               <div className="flex items-center gap-1.5 shrink-0 justify-end">
                                 <button
                                    title="تعديل المهمة"
                                    onClick={() => setEditingTask({...task, dueDayOffset: dayItem.value})}
                                    className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
                                 >
                                    <Edit2 size={16} className="w-4 h-4 sm:w-4 sm:h-4" />
                                 </button>
                                 <button
                                    title="حذف المهمة"
                                    onClick={() => setTaskToDelete(task)}
                                    className="p-2 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                 >
                                    <Trash2 size={16} className="w-4 h-4 sm:w-4 sm:h-4" />
                                 </button>
                                 <select 
                                     disabled={updatingTaskId === task.id}
                                     value={task.effectiveStatus}
                                     onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                                     className={`text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg border-2 border-transparent outline-none cursor-pointer transition-all ${conf.bg} ${conf.color} hover:opacity-80 disabled:opacity-50 appearance-none text-center min-w-[90px] sm:min-w-[100px]`}
                                   >
                                     <option value="not_executed" className="dark:bg-gray-800 text-gray-900 dark:text-gray-200">لم تنفذ</option>
                                     <option value="completed" className="dark:bg-gray-800 text-green-700 dark:text-green-400">مكتملة</option>
                                     <option value="late" className="dark:bg-gray-800 text-red-700 dark:text-red-400">متأخرة</option>
                                     <option value="canceled" className="dark:bg-gray-800 text-gray-600 dark:text-gray-400">ملغاة</option>
                                 </select>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>
                {viewMode === 'tabs' && (
                  <InlineAddTaskRow 
                    weekId={weekId}
                    dayOffset={dayItem.value}
                    cases={allCases}
                    users={usersOptions}
                    user={user}
                    onTaskAdded={(newTask) => setTasks(prev => [...prev, newTask])}
                  />
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      <TaskModal
        isOpen={addTaskDayOffset !== null || editingTask !== null}
        onClose={() => { setAddTaskDayOffset(null); setEditingTask(null); }}
        weekId={weekId}
        defaultDayOffset={editingTask ? editingTask.dueDayOffset : addTaskDayOffset}
        editTask={editingTask}
        cases={allCases}
        users={usersOptions}
        user={user}
        onTaskAdded={(newTask) => setTasks(prev => [...prev, newTask])}
        onTaskUpdated={(updatedTask) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))}
      />

      {/* مودال تأكيد الحذف */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setTaskToDelete(null)}></div>
          
          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden z-10 transform transition-all animate-fade-in-up">
            <div className="p-6 text-center">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف مهمة <strong className="text-gray-800 dark:text-gray-200">"{taskToDelete.title}"</strong> بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 transition-colors flex justify-center items-center"
                >
                  {isDeleting ? <div className="border-2 border-white/30 border-t-white rounded-full w-5 h-5 animate-spin"/> : 'نعم، احذف المهمة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
