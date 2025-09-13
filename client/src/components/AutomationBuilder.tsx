import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Save, 
  Play, 
  Settings, 
  Mail, 
  MessageSquare, 
  Clock, 
  Filter,
  Zap,
  User,
  ShoppingCart,
  MousePointer,
  Eye,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

interface AutomationBuilderProps {
  onSave?: (automation: any) => void;
  initialData?: any;
}

interface Step {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  subType: string;
  name: string;
  properties: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'default' | 'yes' | 'no';
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
}

export const AutomationBuilder: React.FC<AutomationBuilderProps> = ({ 
  onSave, 
  initialData 
}) => {
  const [automationName, setAutomationName] = useState('אוטומציה חדשה');
  const [steps, setSteps] = useState<Step[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // הגדרת סוגי הצעדים
  const stepTypes = {
    triggers: [
      { type: 'contact_created', name: 'קונטקט נוצר', icon: User, color: 'bg-blue-500' },
      { type: 'order_created', name: 'הזמנה נוצרה', icon: ShoppingCart, color: 'bg-blue-500' },
      { type: 'cart_abandoned', name: 'עגלה נטושה', icon: ShoppingCart, color: 'bg-blue-500' },
      { type: 'page_visited', name: 'דף נצפה', icon: Eye, color: 'bg-blue-500' },
    ],
    actions: [
      { type: 'email', name: 'שליחת אימייל', icon: Mail, color: 'bg-green-500' },
      { type: 'sms', name: 'שליחת SMS', icon: MessageSquare, color: 'bg-green-500' },
      { type: 'wait', name: 'המתנה', icon: Clock, color: 'bg-green-500' },
      { type: 'webhook', name: 'Webhook', icon: Settings, color: 'bg-green-500' },
    ],
    conditions: [
      { type: 'field_check', name: 'בדיקת שדה', icon: Filter, color: 'bg-yellow-500' },
      { type: 'segment_check', name: 'בדיקת סגמנט', icon: Filter, color: 'bg-yellow-500' },
    ]
  };

  // הוספת צעד חדש
  const addStep = (type: 'trigger' | 'action' | 'condition', subType: string) => {
    const stepType = stepTypes[type + 's' as keyof typeof stepTypes].find(s => s.type === subType);
    if (!stepType) return;

    const newStep: Step = {
      id: `step-${Date.now()}`,
      type,
      subType,
      name: stepType.name,
      properties: {},
      position: { 
        x: 100 + steps.length * 200, 
        y: 100 + Math.floor(steps.length / 3) * 150 
      },
      connections: []
    };

    setSteps(prev => [...prev, newStep]);
  };

  // מחיקת צעד
  const deleteStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId));
    setConnections(prev => prev.filter(c => c.from !== stepId && c.to !== stepId));
  };

  // התחלת חיבור
  const startConnection = (stepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setConnectingFrom(stepId);
  };

  // סיום חיבור
  const endConnection = (toStepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (connectingFrom && connectingFrom !== toStepId) {
      // בדיקה שאין כבר חיבור בין הצעדים
      const existingConnection = connections.find(c => 
        (c.from === connectingFrom && c.to === toStepId) ||
        (c.from === toStepId && c.to === connectingFrom)
      );
      
      if (!existingConnection) {
        const fromStep = steps.find(s => s.id === connectingFrom);
        const toStep = steps.find(s => s.id === toStepId);
        
        if (fromStep && toStep) {
          const newConnection: Connection = {
            id: `connection-${Date.now()}`,
            from: connectingFrom,
            to: toStepId,
            type: 'default',
            fromPoint: { x: 0, y: 0 }, // נחשב בזמן אמת
            toPoint: { x: 0, y: 0 }    // נחשב בזמן אמת
          };
          
          setConnections(prev => [...prev, newConnection]);
        }
      }
    }
    setConnectingFrom(null);
    setHoveredConnectionPoint(null);
  };

  // בדיקת קרבה לנקודת חיבור (אפקט מגנט)
  const getClosestConnectionPoint = (mouseX: number, mouseY: number) => {
    const magnetDistance = 30; // מרחק המגנט בפיקסלים
    let closest = null;
    let minDistance = magnetDistance;

    steps.forEach(step => {
      if (step.id === connectingFrom) return; // לא לחבר לעצמו
      
      const topPoint = {
        x: step.position.x + 75,
        y: step.position.y,
        stepId: step.id,
        type: 'input'
      };

      const distance = Math.sqrt(
        Math.pow(mouseX - topPoint.x, 2) + Math.pow(mouseY - topPoint.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = topPoint;
      }
    });

    return closest;
  };

  // עדכון מיקום עכבר
  const handleMouseMove = (event: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  // מחיקת חיבור
  const deleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  // התחלת גרירת צעד
  const handleMouseDown = (stepId: string, event: React.MouseEvent) => {
    if (event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains('drag-handle')) {
      return; // לא לגרור אם לחצו על כפתור או נקודת חיבור
    }
    
    event.preventDefault();
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedStep(stepId);
    setIsDragging(true);
    setDragOffset({
      x: event.clientX - rect.left - step.position.x,
      y: event.clientY - rect.top - step.position.y
    });
  };

  // גרירת צעד
  const handleMouseMoveCanvas = (event: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newMousePosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      setMousePosition(newMousePosition);

      // בדיקת מגנט בזמן חיבור
      if (connectingFrom) {
        const closestPoint = getClosestConnectionPoint(newMousePosition.x, newMousePosition.y);
        setHoveredConnectionPoint(closestPoint ? (closestPoint as any).stepId : null);
      }

      // אם גוררים צעד
      if (isDragging && draggedStep) {
        const newPosition = {
          x: Math.max(0, Math.min(newMousePosition.x - dragOffset.x, rect.width - 150)),
          y: Math.max(0, Math.min(newMousePosition.y - dragOffset.y, rect.height - 100))
        };

        setSteps(prev => prev.map(step => 
          step.id === draggedStep 
            ? { ...step, position: newPosition }
            : step
        ));

        // החיבורים יתעדכנו אוטומטית ברינדור
      }
    }
  };

  // סיום גרירה
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedStep(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // מאזינים גלובליים לגרירה
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging && draggedStep && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const newPosition = {
          x: Math.max(0, Math.min(event.clientX - rect.left - dragOffset.x, rect.width - 150)),
          y: Math.max(0, Math.min(event.clientY - rect.top - dragOffset.y, rect.height - 100))
        };

        setSteps(prev => prev.map(step => 
          step.id === draggedStep 
            ? { ...step, position: newPosition }
            : step
        ));

        // החיבורים יתעדכנו אוטומטית ברינדור
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedStep, dragOffset]);

  // עריכת צעד
  const editStep = (step: Step) => {
    setSelectedStep(step);
    setShowStepEditor(true);
  };

  // שמירת שינויים בצעד
  const saveStepChanges = (updatedStep: Step) => {
    setSteps(prev => prev.map(s => s.id === updatedStep.id ? updatedStep : s));
    setShowStepEditor(false);
    setSelectedStep(null);
  };

  // שמירת האוטומציה
  const handleSave = () => {
    const automation = {
      name: automationName,
      steps,
      connections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(automation);
    }
    
    console.log('Automation saved:', automation);
    alert('האוטומציה נשמרה בהצלחה!');
  };

  // הפעלת האוטומציה
  const handleRun = () => {
    console.log('Running automation:', { steps, connections });
    alert('האוטומציה הופעלה!');
  };

  // רינדור צעד
  const renderStep = (step: Step) => {
    const stepType = stepTypes[step.type + 's' as keyof typeof stepTypes].find(s => s.type === step.subType);
    if (!stepType) return null;

    const IconComponent = stepType.icon;
    const isConnecting = connectingFrom === step.id;

    return (
      <div
        key={step.id}
        className={`absolute p-4 rounded-lg shadow-lg hover:shadow-xl transition-all ${stepType.color} text-white min-w-[150px] ${isConnecting ? 'ring-4 ring-white ring-opacity-50' : ''} ${isDragging && draggedStep === step.id ? 'scale-105 cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          left: step.position.x, 
          top: step.position.y,
          userSelect: 'none',
          zIndex: draggedStep === step.id ? 1000 : 1
        }}
        onMouseDown={(e) => handleMouseDown(step.id, e)}
        onClick={(e) => {
          if (isDragging) return; // לא לפתוח עורך בזמן גרירה
          if (connectingFrom) {
            endConnection(step.id, e);
          } else if (!isDragging) {
            editStep(step);
          }
        }}
      >
        {/* נקודת חיבור עליונה */}
        <div 
          className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 cursor-crosshair transition-all ${
            hoveredConnectionPoint === step.id 
              ? 'border-green-500 bg-green-200 scale-125 shadow-lg' 
              : 'border-gray-400 hover:bg-blue-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (connectingFrom && connectingFrom !== step.id) {
              endConnection(step.id, e);
            }
          }}
        />
        
        <div className="flex items-center gap-2 mb-2 drag-handle">
          <IconComponent className="w-5 h-5 pointer-events-none" />
          <span className="font-bold text-sm pointer-events-none">{step.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteStep(step.id);
            }}
            className="mr-auto p-1 hover:bg-white/20 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        
        <div className="text-xs opacity-90 mb-2 pointer-events-none">
          {step.type === 'trigger' && 'מתחיל את התהליך'}
          {step.type === 'action' && 'מבצע פעולה'}
          {step.type === 'condition' && 'בודק תנאי'}
        </div>

        {/* נקודת חיבור תחתונה */}
        <div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-400 cursor-crosshair hover:bg-green-200"
          onClick={(e) => {
            e.stopPropagation();
            startConnection(step.id, e);
          }}
        />
      </div>
    );
  };

  // רינדור חיבור
  const renderConnection = (connection: Connection) => {
    const fromStep = steps.find(s => s.id === connection.from);
    const toStep = steps.find(s => s.id === connection.to);
    
    if (!fromStep || !toStep) {
      return null;
    }

    // חישוב מיקומים בזמן אמת
    const startX = fromStep.position.x + 75; // מרכז הצעד
    const startY = fromStep.position.y + 80; // תחתית הצעד
    const endX = toStep.position.x + 75;     // מרכז הצעד
    const endY = toStep.position.y;          // עליון הצעד

    // חישוב נקודת בקרה לעקומה
    const controlY = startY + (endY - startY) / 2;
    const pathData = `M ${startX} ${startY} Q ${startX} ${controlY} ${endX} ${endY}`;

    const isSelected = selectedConnection === connection.id;
    const strokeColor = isSelected ? "#EF4444" : "#4F46E5";
    const strokeWidth = isSelected ? "4" : "3";

    return (
      <g key={connection.id}>
        <path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          markerEnd={isSelected ? "url(#arrowhead-red)" : "url(#arrowhead)"}
          className={`transition-all ${isSelected ? 'animate-pulse' : 'hover:stroke-purple-500'}`}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedConnection(selectedConnection === connection.id ? null : connection.id);
          }}
        />
        
        {/* אייקון פח למחיקה - מופיע רק כשהחיבור נבחר */}
        {isSelected && (
          <g>
            {/* רקע לאייקון */}
            <circle
              cx={(startX + endX) / 2}
              cy={(startY + endY) / 2}
              r="12"
              fill="white"
              stroke="#EF4444"
              strokeWidth="2"
              className="cursor-pointer"
            />
            {/* אייקון פח */}
            <g
              transform={`translate(${(startX + endX) / 2 - 6}, ${(startY + endY) / 2 - 6})`}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                deleteConnection(connection.id);
                setSelectedConnection(null);
              }}
            >
              <path
                d="M3 6h12v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6zM8 6V4a2 2 0 012-2h0a2 2 0 012 2v2M10 11v4M6 11v4"
                stroke="#EF4444"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="scale(0.5)"
              />
            </g>
          </g>
        )}
      </g>
    );
  };

  // רינדור קו זמני בזמן חיבור
  const renderTempConnection = () => {
    if (!connectingFrom) return null;

    const fromStep = steps.find(s => s.id === connectingFrom);
    if (!fromStep) return null;

    const startX = fromStep.position.x + 75;
    const startY = fromStep.position.y + 80;
    
    // אם יש נקודה קרובה (מגנט), חבר אליה
    const closestPoint = getClosestConnectionPoint(mousePosition.x, mousePosition.y);
    const endX = closestPoint ? (closestPoint as any).x : mousePosition.x;
    const endY = closestPoint ? (closestPoint as any).y : mousePosition.y;

    // צבע הקו - ירוק אם יש מגנט, אדום אחרת
    const strokeColor = closestPoint ? "#22C55E" : "#EF4444";
    const strokeWidth = closestPoint ? "3" : "2";

    return (
      <g>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray="5,5"
          className="pointer-events-none"
        />
        {/* נקודה מהבהבת בסוף הקו */}
        <circle
          cx={endX}
          cy={endY}
          r="4"
          fill={strokeColor}
          className="pointer-events-none animate-pulse"
        />
      </g>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* כותרת וכלים */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={automationName}
              onChange={(e) => setAutomationName(e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none"
              placeholder="שם האוטומציה"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              שמור
            </button>
            
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              הפעל
            </button>
          </div>
        </div>

        {/* סרגל כלים */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">טריגרים</h3>
            <div className="flex gap-2 flex-wrap">
              {stepTypes.triggers.map((trigger) => (
                <button
                  key={trigger.type}
                  onClick={() => addStep('trigger', trigger.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm hover:opacity-90 ${trigger.color}`}
                >
                  <trigger.icon className="w-4 h-4" />
                  {trigger.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">פעולות</h3>
            <div className="flex gap-2 flex-wrap">
              {stepTypes.actions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => addStep('action', action.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm hover:opacity-90 ${action.color}`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">תנאים</h3>
            <div className="flex gap-2 flex-wrap">
              {stepTypes.conditions.map((condition) => (
                <button
                  key={condition.type}
                  onClick={() => addStep('condition', condition.type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm hover:opacity-90 ${condition.color}`}
                >
                  <condition.icon className="w-4 h-4" />
                  {condition.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* אזור הבילדר */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={canvasRef}
          className="w-full h-full relative bg-gray-100"
          style={{ 
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUp}
          onClick={() => {
            setConnectingFrom(null);
            setSelectedConnection(null);
          }}
        >
          {/* SVG לחיבורים */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            style={{ zIndex: 1, pointerEvents: 'none' }}
            preserveAspectRatio="none"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#4F46E5"
                />
              </marker>
              <marker
                id="arrowhead-red"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#EF4444"
                />
              </marker>
            </defs>
            {connections.map(renderConnection)}
            {renderTempConnection()}
          </svg>

          {/* הצעדים */}
          <div style={{ zIndex: 2, position: 'relative' }}>
            {steps.map(renderStep)}
          </div>
          
          {steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
              <div className="text-center text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">התחל לבנות את האוטומציה שלך</h3>
                <p className="text-sm">הוסף טריגרים, פעולות ותנאים מהסרגל העליון</p>
                <div className="text-xs mt-4 space-y-1">
                  <p className="text-blue-600">💡 <strong>גרירה:</strong> לחץ וגרור צעד כדי להזיז אותו</p>
                  <p className="text-green-600">🧲 <strong>חיבור:</strong> לחץ על הנקודה התחתונה וגרור לנקודה העליונה</p>
                  <p className="text-red-600">🗑️ <strong>מחיקת חיבור:</strong> לחץ על הקו ואז על אייקון הפח</p>
                  <p className="text-purple-600">✏️ <strong>עריכה:</strong> לחץ על הצעד כדי לערוך אותו</p>
                </div>
              </div>
            </div>
          )}

          {/* הודעת עזרה בזמן חיבור */}
          {connectingFrom && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg" style={{ zIndex: 4 }}>
              <p className="text-sm">🧲 גרור הקו אל נקודת החיבור הירוקה</p>
              <p className="text-xs opacity-90">הקו יהפך ירוק כשתתקרב לנקודה</p>
            </div>
          )}

          {/* הודעת עזרה בזמן גרירה */}
          {isDragging && draggedStep && (
            <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg" style={{ zIndex: 4 }}>
              <p className="text-sm">🖱️ גורר צעד...</p>
              <p className="text-xs opacity-90">שחרר כדי לסיים</p>
            </div>
          )}
        </div>
      </div>

      {/* פאנל מידע */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              צעדים: {steps.length} | חיבורים: {connections.length}
              {connections.length > 0 && (
                <span className="mr-2 text-blue-600">
                  (מזהי חיבורים: {connections.map(c => c.id.slice(-4)).join(', ')})
                </span>
              )}
            </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>טריגרים</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>פעולות</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>תנאים</span>
            </div>
          </div>
        </div>
      </div>

      {/* מודל עריכת צעד */}
      {showStepEditor && selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">עריכת צעד</h3>
              <button
                onClick={() => setShowStepEditor(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם הצעד
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) => setSelectedStep({
                    ...selectedStep,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* שדות ספציפיים לפי סוג הצעד */}
              {selectedStep.subType === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      נושא האימייל
                    </label>
                    <input
                      type="text"
                      value={selectedStep.properties.subject || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        properties: { ...selectedStep.properties, subject: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      תוכן האימייל
                    </label>
                    <textarea
                      rows={4}
                      value={selectedStep.properties.content || ''}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        properties: { ...selectedStep.properties, content: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {selectedStep.subType === 'sms' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הודעת SMS
                  </label>
                  <textarea
                    rows={3}
                    value={selectedStep.properties.message || ''}
                    onChange={(e) => setSelectedStep({
                      ...selectedStep,
                      properties: { ...selectedStep.properties, message: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {selectedStep.subType === 'wait' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      משך זמן
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={selectedStep.properties.duration || 1}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        properties: { ...selectedStep.properties, duration: parseInt(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      יחידת זמן
                    </label>
                    <select
                      value={selectedStep.properties.unit || 'minutes'}
                      onChange={(e) => setSelectedStep({
                        ...selectedStep,
                        properties: { ...selectedStep.properties, unit: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="minutes">דקות</option>
                      <option value="hours">שעות</option>
                      <option value="days">ימים</option>
                      <option value="weeks">שבועות</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowStepEditor(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                ביטול
              </button>
              <button
                onClick={() => saveStepChanges(selectedStep)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 