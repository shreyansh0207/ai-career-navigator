// Generates a candidate-specific learning mindmap and renders it with React Flow.
import { useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface MindmapData {
  nodes: Array<{
    id: string;
    label: string;
    category?: string;
    level: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
}

// Simplified color scheme - semantic and easy to understand
const levelColors = [
  'hsl(280, 70%, 60%)',  // Central node - vibrant purple
  'hsl(200, 70%, 55%)',  // Level 1 - blue
  'hsl(160, 65%, 50%)',  // Level 2 - green
  'hsl(30, 75%, 55%)',   // Level 3 - orange
  'hsl(340, 70%, 60%)',  // Level 4+ - pink
];

function createFlowNodes(mindmapData: MindmapData): Node[] {
  return mindmapData.nodes.map((node) => {
    const level = node.level || 0;
    const nodesInLevel = mindmapData.nodes.filter((item) => item.level === level);
    const indexInLevel = nodesInLevel.indexOf(node);
    const horizontalSpacing = 300;
    const verticalSpacing = 180;
    const x = level === 0 ? 0 : indexInLevel * horizontalSpacing - ((nodesInLevel.length - 1) * horizontalSpacing) / 2;
    const fontSize = level === 0 ? '16px' : level === 1 ? '14px' : '13px';
    const padding = level === 0 ? '16px 28px' : level === 1 ? '12px 24px' : '10px 20px';
    return {
      id: node.id,
      type: 'default',
      data: {
        label: (
          <div className="text-center">
            <div className="font-semibold whitespace-nowrap">{node.label}</div>
            {node.category && level > 0 && <div className="text-xs opacity-80 mt-1">{node.category}</div>}
          </div>
        ),
      },
      position: { x, y: level * verticalSpacing },
      style: {
        background: levelColors[Math.min(level, levelColors.length - 1)],
        color: 'white',
        border: level === 0 ? '3px solid rgba(255, 255, 255, 0.4)' : '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: level === 0 ? '16px' : '10px',
        padding,
        fontSize,
        fontWeight: level === 0 ? '600' : '500',
        boxShadow: level === 0 ? '0 8px 24px rgba(0, 0, 0, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: level === 0 ? '160px' : '140px',
      },
    };
  });
}
// The edges are styled with a consistent color and arrowheads for clarity.
function createFlowEdges(mindmapData: MindmapData): Edge[] {
  return mindmapData.edges.map((edge, index) => ({
    id: `e${index}`,
    source: edge.from,
    target: edge.to,
    type: 'smoothstep',
    animated: false,
    style: { stroke: 'hsl(260, 60%, 65%)', strokeWidth: 2.5, opacity: 0.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(260, 60%, 65%)', width: 20, height: 20 },
  }));
}
// The MindmapGenerator component provides a user interface for generating and visualizing a learning mindmap based on user input.
export function MindmapGenerator() {
  const { profile, saveProfile } = useAuth();
  const [domain, setDomain] = useState(profile.mindmap?.domain || '');
  const [learningGoal, setLearningGoal] = useState(profile.mindmap?.learningGoal || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(profile.mindmap ? createFlowNodes(profile.mindmap) : []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(profile.mindmap ? createFlowEdges(profile.mindmap) : []);

  const generateMindmap = async () => {
    if (!domain.trim() || !learningGoal.trim()) {
      toast.error('Please enter both domain and learning goal');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiRequest<{ mindmap: MindmapData }>('/ai/generate-mindmap', {
        method: 'POST',
        body: JSON.stringify({ domain, learningGoal }),
      });

      const mindmapData = result.mindmap;
      setNodes(createFlowNodes(mindmapData));
      setEdges(createFlowEdges(mindmapData));
      await saveProfile({ mindmap: { ...mindmapData, domain, learningGoal } });
      toast.success('Mindmap generated successfully!');
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast.error('Failed to generate mindmap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMindmap = () => {
    // Simple download functionality - convert to image would require additional library
    toast.info('Download feature coming soon!');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Mindmap Generator</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a clear visual roadmap of concepts, skills, and technologies to master
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Domain / Technology</label>
            <Input
              placeholder="e.g., Machine Learning, Web Development, Data Science"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Learning Goal</label>
            <Textarea
              placeholder="e.g., Become a full-stack developer, Master deep learning fundamentals"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              className="bg-background min-h-[80px]"
            />
          </div>

          <Button 
            onClick={generateMindmap} 
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Mindmap...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Mindmap
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {nodes.length > 0 && (
        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="h-[600px] rounded-lg overflow-hidden bg-background/50">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-left"
              >
                <Background />
                <Controls />
                <Panel position="top-right" className="space-x-2">
                  <Button size="sm" variant="secondary" onClick={downloadMindmap}>
                    <Download className="h-4 w-4" />
                  </Button>
                </Panel>
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
