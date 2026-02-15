import { ChatGeneratedImageContentPart } from '@/lib/static';
import { Dialog, DialogContent, IconButton, Skeleton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import styled from '@emotion/styled';

type Props = {
  image: ChatGeneratedImageContentPart;
};

const ImageContainer = styled.div`
  max-width: 384px;
  position: relative;
`;

const StyledImage = styled.img<{ $loaded: boolean }>`
  max-width: 384px;
  max-height: 384px;
  width: 100%;
  height: auto;
  object-fit: contain;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
  display: ${({ $loaded }) => ($loaded ? 'block' : 'none')};

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const ImageSkeleton = styled(Skeleton)`
  width: 384px;
  height: 256px;
  border-radius: 8px;
`;

const DialogImage = styled.img`
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const RevisedPrompt = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export default function GeneratedImage({ image }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleImageClick = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <ImageContainer>
        {!loaded && <ImageSkeleton variant='rectangular' animation='wave' />}
        <StyledImage
          src={image.image_url}
          alt={image.revised_prompt || 'AI generated image'}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          $loaded={loaded}
        />
        {image.revised_prompt && loaded && <RevisedPrompt>{image.revised_prompt}</RevisedPrompt>}
      </ImageContainer>

      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            position: 'relative',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <CloseButton onClick={handleDialogClose} size='small'>
            <CloseIcon />
          </CloseButton>
          <DialogImage src={image.image_url} alt={image.revised_prompt || 'AI generated image'} />
        </DialogContent>
      </Dialog>
    </>
  );
}
