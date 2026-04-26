import styled from '@emotion/styled';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

const StyledAvatarRoot = styled(AvatarPrimitive.Root)`
  position: relative;
  display: flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
`;

function Avatar(props: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <StyledAvatarRoot data-slot='avatar' {...props} />;
}

const StyledAvatarImage = styled(AvatarPrimitive.Image)`
  aspect-ratio: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

function AvatarImage(props: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <StyledAvatarImage data-slot='avatar-image' {...props} />;
}

const StyledAvatarFallback = styled(AvatarPrimitive.Fallback)`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #616161;
  font-size: 14px;
  font-weight: 500;
`;

function AvatarFallback(props: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <StyledAvatarFallback data-slot='avatar-fallback' {...props} />;
}

export { Avatar, AvatarFallback, AvatarImage };
