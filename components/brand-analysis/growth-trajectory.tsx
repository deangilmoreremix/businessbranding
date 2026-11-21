import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFraction } from '@/lib/format';

export interface GrowthTrajectory { current: number | null; projected: number | null; trend: 'up' | 'down' | 'stable'; timeframe?: string }

/** Growth card of the brand analysis. `current`/`projected` are fractions (normalizeAnalysis guarantees it): 0.5 shows "50.0%". */
export function GrowthTrajectoryCard({ growth }: { growth: GrowthTrajectory | null }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Growth Trajectory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Growth</span>
            <span className="font-medium" data-testid="growth-current">{formatFraction(growth?.current, 1, 'Not measured')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Projected Growth</span>
            <span className="font-medium" data-testid="growth-projected">{formatFraction(growth?.projected, 1, 'Not measured')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Trend</span>
            {growth ? <Badge variant={growth.trend === 'up' ? 'default' : growth.trend === 'down' ? 'destructive' : 'secondary'}>
              {growth.trend === 'up' ? '↗ Growing' : growth.trend === 'down' ? '↘ Declining' : '→ Stable'}
            </Badge> : <span className="font-medium">Not measured</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
