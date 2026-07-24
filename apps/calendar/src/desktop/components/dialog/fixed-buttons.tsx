import styled from '@emotion/styled';
import { isMobile } from '@konomi-app/kintone-utilities';
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
import { handleCalendarEventCopyAtom, handleCalendarEventDeleteAtom } from '../../states/calendar';
import { dialogPropsAtom } from '../../states/dialog';

const Component: FCX = ({ className }) => {
  const props = useAtomValue(dialogPropsAtom);
  const handleEventDelete = useSetAtom(handleCalendarEventDeleteAtom);
  const handleEventCopy = useSetAtom(handleCalendarEventCopyAtom);

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
                className='contents text-inherit'
                href={`${location.pathname}show${isMobile() ? '?' : '#'}record=${props.event.id}`}
              >
                <MenuItem>
                  <ListItemIcon>
                    <File className='w-5 h-5' />
                  </ListItemIcon>
                  <ListItemText>詳細</ListItemText>
                </MenuItem>
              </a>
              <MenuItem onClick={handleEventCopy}>
                <ListItemIcon>
                  <Copy className='w-5 h-5' />
                </ListItemIcon>
                <ListItemText>コピー</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleEventDelete}>
                <ListItemIcon>
                  <Trash2 className='w-5 h-5' />
                </ListItemIcon>
                <ListItemText>削除</ListItemText>
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
