import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { FC } from 'react';

const shimmer = keyframes`
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 320px;
  overflow: hidden;
  border-top: 1px solid #e0e0e0;
`;

const SidebarSkeleton = styled.div`
  width: 240px;
  min-width: 240px;
  border-right: 2px solid #e0e0e0;
  flex-shrink: 0;
`;

const TimelineSkeleton = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const SkeletonPulse = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: 3px;
`;

const GroupHeaderSkeleton = styled.div`
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  gap: 8px;
`;

const GroupLabelSkeleton = styled(SkeletonPulse)`
  width: 80px;
  height: 12px;
`;

const GroupCountSkeleton = styled(SkeletonPulse)`
  width: 24px;
  height: 12px;
`;

const TaskRowSkeleton = styled.div`
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const TaskLabelSkeleton = styled(SkeletonPulse)<{ width?: number }>`
  width: ${({ width }) => width ?? 120}px;
  height: 11px;
`;

const TimelineHeaderSkeleton = styled.div`
  height: 50px;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
`;

const TimelineHeaderRow = styled.div`
  display: flex;
  flex: 1;
  gap: 0;
`;

const TimelineHeaderCell = styled(SkeletonPulse)<{ width?: number }>`
  width: ${({ width }) => width ?? 40}px;
  height: 10px;
  margin: auto 8px;
  border-radius: 2px;
`;

const BarSkeleton = styled(SkeletonPulse)<{ left: number; width: number }>`
  position: absolute;
  top: 5px;
  left: ${({ left }) => left}px;
  width: ${({ width }) => width}px;
  height: 22px;
  border-radius: 4px;
`;

const TimelineGroupSection = styled.div`
  position: relative;
`;

const TimelineGroupHeader = styled.div`
  height: 36px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
`;

const TimelineTaskRow = styled.div`
  height: 32px;
  position: relative;
  border-bottom: 1px solid #f0f0f0;
`;

// 疑似ランダム生成（シード固定で安定表示）
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const SKELETON_GROUPS = [{ taskCount: 4 }, { taskCount: 3 }, { taskCount: 2 }];

export const SkeletonLoader: FC = () => {
  return (
    <SkeletonContainer>
      <SidebarSkeleton>
        {SKELETON_GROUPS.map((group, gi) => (
          <div key={gi}>
            <GroupHeaderSkeleton>
              <GroupLabelSkeleton style={{ width: 60 + pseudoRandom(gi * 7) * 60 }} />
              <GroupCountSkeleton />
            </GroupHeaderSkeleton>
            {Array.from({ length: group.taskCount }).map((_, ti) => (
              <TaskRowSkeleton key={ti}>
                <TaskLabelSkeleton width={60 + pseudoRandom(gi * 13 + ti * 3) * 80} />
              </TaskRowSkeleton>
            ))}
          </div>
        ))}
      </SidebarSkeleton>
      <TimelineSkeleton>
        <TimelineHeaderSkeleton>
          <TimelineHeaderRow>
            {Array.from({ length: 8 }).map((_, i) => (
              <TimelineHeaderCell key={i} width={30 + pseudoRandom(i * 5) * 40} />
            ))}
          </TimelineHeaderRow>
          <TimelineHeaderRow>
            {Array.from({ length: 12 }).map((_, i) => (
              <TimelineHeaderCell key={i} width={16 + pseudoRandom(i * 3 + 1) * 16} />
            ))}
          </TimelineHeaderRow>
        </TimelineHeaderSkeleton>
        {SKELETON_GROUPS.map((group, gi) => (
          <TimelineGroupSection key={gi}>
            <TimelineGroupHeader />
            {Array.from({ length: group.taskCount }).map((_, ti) => {
              const left = 20 + pseudoRandom(gi * 17 + ti * 11) * 200;
              const width = 60 + pseudoRandom(gi * 23 + ti * 7) * 180;
              return (
                <TimelineTaskRow key={ti}>
                  <BarSkeleton left={left} width={width} />
                </TimelineTaskRow>
              );
            })}
          </TimelineGroupSection>
        ))}
      </TimelineSkeleton>
    </SkeletonContainer>
  );
};
