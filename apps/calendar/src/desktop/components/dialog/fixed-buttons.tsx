import styled from '@emotion/styled';
import { getRecordDetailUrl } from '@/desktop/record-url';
import { t } from '@/lib/i18n-plugin';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { Copy, File, Trash2 } from 'lucide-react';
import { FCX, useState } from 'react';
import { copyDialogEventAtom, deleteDialogEventAtom } from '../../states/event-operations';
import { dialogPropsAtom } from '../../states/dialog';

const Component: FCX = ({ className }) => {
  const props = useAtomValue(dialogPropsAtom);
  const handleEventDelete = useSetAtom(deleteDialogEventAtom);
  const handleEventCopy = useSetAtom(copyDialogEventAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={className}>
      {!props.new && (
        <>
          <IconButton onClick={handleClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            anchorEl={anchorEl}
          >
            <MenuList
              className='🐸'
              sx={{
                minWidth: '200px',
              }}
            >
              <a
                className='rad:contents rad:text-inherit'
                href={getRecordDetailUrl(String(props.event.id))}
              >
                <MenuItem>
                  <ListItemIcon>
                    <File className='rad:w-5 rad:h-5' />
                  </ListItemIcon>
                  <ListItemText>{t('desktop.contextMenu.showDetail')}</ListItemText>
                </MenuItem>
              </a>
              <MenuItem
                onClick={() => {
                  handleClose();
                  handleEventCopy();
                }}
              >
                <ListItemIcon>
                  <Copy className='rad:w-5 rad:h-5' />
                </ListItemIcon>
                <ListItemText>{t('desktop.contextMenu.copy')}</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  handleClose();
                  handleEventDelete();
                }}
              >
                <ListItemIcon>
                  <Trash2 className='rad:w-5 rad:h-5' />
                </ListItemIcon>
                <ListItemText>{t('desktop.contextMenu.delete')}</ListItemText>
              </MenuItem>
            </MenuList>
          </Menu>
        </>
      )}
    </div>
  );
};

const FixedButton = styled(Component)`
  position: absolute;
  right: 1rem;
  top: 1rem;

  display: flex;
  align-items: center;
  gap: 8px;

  color: #0009;
  a {
    color: #0009;
  }

  .icon {
    box-shadow: none;
  }
`;

export default FixedButton;
