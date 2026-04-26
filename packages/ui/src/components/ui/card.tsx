import styled from '@emotion/styled';
import type * as React from 'react';

const StyledCard = styled.div`
  background-color: #fff;
  color: #212121;
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 24px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

function Card(props: React.ComponentProps<'div'>) {
  return <StyledCard data-slot='card' {...props} />;
}

const StyledCardHeader = styled.div`
  display: grid;
  grid-auto-rows: min-content;
  grid-template-rows: auto auto;
  align-items: flex-start;
  gap: 6px;
  padding: 0 24px;
`;

function CardHeader(props: React.ComponentProps<'div'>) {
  return <StyledCardHeader data-slot='card-header' {...props} />;
}

const StyledCardTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 1.2;
  color: #212121;
`;

function CardTitle(props: React.ComponentProps<'div'>) {
  return <StyledCardTitle data-slot='card-title' {...props} />;
}

const StyledCardDescription = styled.div`
  color: #757575;
  font-size: 14px;
  line-height: 1.5;
`;

function CardDescription(props: React.ComponentProps<'div'>) {
  return <StyledCardDescription data-slot='card-description' {...props} />;
}

const StyledCardAction = styled.div`
  grid-column-start: 2;
  grid-row: 1 / span 2;
  align-self: flex-start;
  justify-self: end;
`;

function CardAction(props: React.ComponentProps<'div'>) {
  return <StyledCardAction data-slot='card-action' {...props} />;
}

const StyledCardContent = styled.div`
  padding: 0 24px;
`;

function CardContent(props: React.ComponentProps<'div'>) {
  return <StyledCardContent data-slot='card-content' {...props} />;
}

const StyledCardFooter = styled.div`
  display: flex;
  align-items: center;
  padding: 0 24px;
`;

function CardFooter(props: React.ComponentProps<'div'>) {
  return <StyledCardFooter data-slot='card-footer' {...props} />;
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
