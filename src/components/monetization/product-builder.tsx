'use client';

import React, { useState } from 'react';

interface LessonData {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  dripDelayDays: number;
}

interface ModuleData {
  id: string;
  title: string;
  order: number;
  lessons: LessonData[];
}

interface ProductBuilderProps {
  initialModules?: ModuleData[];
  courseTitle: string;
  onSave: (modules: ModuleData[]) => void;
}

/**
 * Premium Course Builder allowing creators to organize modules, add lessons,
 * specify video durations, and configure drip delays.
 */
export function ProductBuilder({ initialModules = [], courseTitle, onSave }: ProductBuilderProps) {
  const [modules, setModules] = useState<ModuleData[]>(initialModules);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    initialModules[0]?.id || null
  );

  // Form states
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState(10);
  const [newLessonDrip, setNewLessonDrip] = useState(0);

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;

    const newModule: ModuleData = {
      id: `mod_${Math.random().toString(36).substring(7)}`,
      title: newModuleTitle.trim(),
      order: modules.length + 1,
      lessons: [],
    };

    setModules((prev) => [...prev, newModule]);
    setActiveModuleId(newModule.id);
    setNewModuleTitle('');
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !activeModuleId) return;

    const newLesson: LessonData = {
      id: `les_${Math.random().toString(36).substring(7)}`,
      title: newLessonTitle.trim(),
      content: '',
      videoUrl: newLessonVideoUrl.trim() || 'https://vimeo.com/placeholder',
      duration: newLessonDuration,
      dripDelayDays: newLessonDrip,
    };

    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id === activeModuleId) {
          return {
            ...mod,
            lessons: [...mod.lessons, newLesson],
          };
        }
        return mod;
      })
    );

    setNewLessonTitle('');
    setNewLessonVideoUrl('');
    setNewLessonDuration(10);
    setNewLessonDrip(0);
  };

  const handleRemoveLesson = (moduleId: string, lessonId: string) => {
    setModules((prev) =>
      prev.map((mod) => {
        if (mod.id === moduleId) {
          return {
            ...mod,
            lessons: mod.lessons.filter((les) => les.id !== lessonId),
          };
        }
        return mod;
      })
    );
  };

  const handleSave = () => {
    onSave(modules);
  };

  return (
    <div className="w-full bg-surface border border-border rounded-medium p-6 shadow-card select-none">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{courseTitle}</h2>
          <p className="text-xs text-text-secondary">Structure modules and configure drip settings</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-small text-xs font-semibold shadow-card transition-colors cursor-pointer"
        >
          Save Course Draft
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module Sidebar */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Modules</h3>
          
          <div className="space-y-2">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`w-full flex justify-between items-center p-3 border rounded-medium text-left text-xs font-semibold transition-all ${
                  activeModuleId === mod.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-text-primary hover:border-text-secondary'
                }`}
              >
                <span>{mod.title}</span>
                <span className="bg-border text-text-secondary px-2 py-0.5 rounded-full text-[10px]">
                  {mod.lessons.length} Lessons
                </span>
              </button>
            ))}
          </div>

          {/* Add Module Form */}
          <form onSubmit={handleAddModule} className="flex gap-2">
            <input
              type="text"
              placeholder="Module name..."
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary placeholder:text-text-secondary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-small text-xs font-semibold cursor-pointer"
            >
              + Add
            </button>
          </form>
        </div>

        {/* Lesson Editor Area */}
        <div className="md:col-span-2 space-y-6">
          {activeModuleId ? (
            <>
              {/* Add Lesson Form */}
              <div className="p-4 bg-background border border-border rounded-medium">
                <h4 className="text-xs font-bold text-text-primary mb-3">Add Lesson to Active Module</h4>
                <form onSubmit={handleAddLesson} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Lesson Title"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      className="px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary placeholder:text-text-secondary"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Video URL (e.g. Vimeo/Mux)"
                      value={newLessonVideoUrl}
                      onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                      className="px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary placeholder:text-text-secondary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-text-secondary uppercase">Min Duration</label>
                      <input
                        type="number"
                        value={newLessonDuration}
                        onChange={(e) => setNewLessonDuration(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-text-secondary">min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-text-secondary uppercase">Drip Delay</label>
                      <input
                        type="number"
                        value={newLessonDrip}
                        onChange={(e) => setNewLessonDrip(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-text-secondary">days</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-secondary hover:bg-secondary/90 text-white rounded-small text-xs font-semibold shadow-card transition-colors cursor-pointer"
                    >
                      + Add Lesson
                    </button>
                  </div>
                </form>
              </div>

              {/* Lessons List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Lesson Sequence</h4>
                
                {modules.find((m) => m.id === activeModuleId)?.lessons.map((les, index) => (
                  <div
                    key={les.id}
                    className="flex justify-between items-center p-4 border border-border bg-background rounded-medium hover:border-text-secondary transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">
                        {index + 1}. {les.title}
                      </div>
                      <div className="flex gap-4 mt-1 text-[10px] text-text-secondary">
                        <span>⏱️ {les.duration} mins</span>
                        {les.dripDelayDays > 0 ? (
                          <span className="text-warning">⏳ Drips after {les.dripDelayDays} days</span>
                        ) : (
                          <span className="text-secondary">🔓 Available Immediately</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLesson(activeModuleId, les.id)}
                      className="text-text-secondary hover:text-danger text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}

                {modules.find((m) => m.id === activeModuleId)?.lessons.length === 0 && (
                  <p className="text-xs text-text-secondary italic text-center py-6">
                    No lessons in this module. Add a lesson above to get started.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 border border-border rounded-medium bg-background text-text-secondary italic text-xs">
              Create and select a module on the left to start building your course lessons.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ProductBuilder;
