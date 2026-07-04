import { useState, useRef } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";

interface WorkflowStep {
  id: string;
  order: number;
  type: "send_email" | "create_task" | "assign_user" | "notification" | "condition";
  config: Record<string, any>;
  condition?: any;
}

interface WorkflowEditorProps {
  onSave: (steps: WorkflowStep[]) => void;
  initialSteps?: WorkflowStep[];
  readonly?: boolean;
}

const STEP_TYPES = [
  { id: "send_email", label: "Send Email", icon: "📧", color: "bg-blue-100" },
  { id: "create_task", label: "Create Task", icon: "✅", color: "bg-green-100" },
  { id: "assign_user", label: "Assign User", icon: "👤", color: "bg-purple-100" },
  { id: "notification", label: "Send Notification", icon: "🔔", color: "bg-orange-100" },
  { id: "condition", label: "Conditional Logic", icon: "🔀", color: "bg-red-100" },
];

export default function WorkflowEditor({ onSave, initialSteps = [], readonly = false }: WorkflowEditorProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showStepLibrary, setShowStepLibrary] = useState(false);
  const draggedStep = useRef<WorkflowStep | null>(null);

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      type: type as any,
      config: {},
    };
    setSteps([...steps, newStep]);
    setShowStepLibrary(false);
    setSelectedStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    const updatedSteps = steps
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updatedSteps);
    setSelectedStepId(null);
  };

  const moveStep = (id: string, direction: "up" | "down") => {
    const idx = steps.findIndex((s) => s.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    if (direction === "up") {
      [newSteps[idx], newSteps[idx - 1]] = [newSteps[idx - 1], newSteps[idx]];
    } else {
      [newSteps[idx], newSteps[idx + 1]] = [newSteps[idx + 1], newSteps[idx]];
    }
    newSteps.forEach((s, i) => (s.order = i + 1));
    setSteps(newSteps);
  };

  const updateStepConfig = (id: string, config: Record<string, any>) => {
    setSteps(
      steps.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, ...config } } : s
      )
    );
  };

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  return (
    <div className="flex h-full gap-6 p-6 bg-gray-50">
      {/* Left Panel - Canvas */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Workflow Steps</h2>
          {!readonly && (
            <button
              onClick={() => setShowStepLibrary(!showStepLibrary)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Step
            </button>
          )}
        </div>

        {/* Step Library */}
        {showStepLibrary && !readonly && (
          <div className="mb-6 grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
            {STEP_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => addStep(type.id)}
                className={`p-3 rounded-lg text-left transition-all hover:shadow-md ${type.color}`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="font-medium text-gray-900 text-sm">{type.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Steps Canvas */}
        <div className="space-y-3">
          {steps.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">No steps yet</p>
                <p className="text-sm">Click "Add Step" to start building your workflow</p>
              </div>
            </div>
          ) : (
            steps.map((step, idx) => {
              const stepType = STEP_TYPES.find((t) => t.id === step.type);
              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStepId === step.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{stepType?.icon}</div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Step {step.order}: {stepType?.label}
                        </p>
                        {step.config.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {step.config.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {!readonly && (
                      <div className="flex gap-1">
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(step.id, "up");
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {idx < steps.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(step.id, "down");
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-600"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(step.id);
                          }}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Arrow between steps */}
                  {idx < steps.length - 1 && (
                    <div className="text-center text-gray-400 my-2">↓</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Save Button */}
        {!readonly && (
          <button
            onClick={() => onSave(steps)}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Save className="w-5 h-5" /> Save Workflow
          </button>
        )}
      </div>

      {/* Right Panel - Step Configuration */}
      <div className="w-80 bg-white rounded-lg shadow-sm p-6">
        {selectedStep ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Step Configuration</h3>
              <button
                onClick={() => setSelectedStepId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Step Type
              </label>
              <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {STEP_TYPES.find((t) => t.id === selectedStep.type)?.label}
              </div>
            </div>

            {/* Configuration Fields Based on Step Type */}
            {selectedStep.type === "send_email" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Email Template
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., welcome, confirmation"
                    value={selectedStep.config.template || ""}
                    onChange={(e) =>
                      updateStepConfig(selectedStep.id, { template: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="What this step does"
                    value={selectedStep.config.description || ""}
                    onChange={(e) =>
                      updateStepConfig(selectedStep.id, {
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {selectedStep.type === "create_task" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Task Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Complete profile"
                    value={selectedStep.config.title || ""}
                    onChange={(e) =>
                      updateStepConfig(selectedStep.id, { title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedStep.config.priority || "medium"}
                    onChange={(e) =>
                      updateStepConfig(selectedStep.id, { priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>low</option>
                    <option>medium</option>
                    <option>high</option>
                  </select>
                </div>
              </div>
            )}

            {selectedStep.type === "condition" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Field
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., role, status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Operator
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>=== </option>
                    <option>!==</option>
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>contains</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., admin, active"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {!["send_email", "create_task", "condition"].includes(
              selectedStep.type
            ) && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  Configure the "{selectedStep.type}" step properties using the fields
                  above.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="font-medium">No step selected</p>
              <p className="text-sm mt-1">Click a step to configure it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
