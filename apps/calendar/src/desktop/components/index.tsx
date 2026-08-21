import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { t } from '@/lib/i18n-plugin';
import { store } from '@/lib/store';
import { cn } from '@/lib/utils';
import styled from '@emotion/styled';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { jaJP } from '@mui/material/locale';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { Suspense } from 'react';
import { useInitialize } from '../hooks/use-initialize';
import { useIsMobile } from '../hooks/use-mobile';
import Calendar from './calendar';
import DetailedDialog from './detailed-dialog';
import Dialog from './dialog';
import OccurrenceScopeDialog from './dialog/occurrence-scope-dialog';
import Fab from './fab';
import Sidebar from './sidebar';

function DesktopLayout({ className }: { className?: string; }) {
  useInitialize();
  const isMobile = useIsMobile();

  return (
    <>
      <Dialog />
      <OccurrenceScopeDialog />
      <DetailedDialog />
      <div className='🐸'>
        <div
          className={cn(`rad:grid rad:grid-cols-[auto_1fr] ${className}`, {
            'rad:grid-cols-1': isMobile,
          })}
        >
          <Sidebar />
          <Calendar />
        </div>
      </div>
      <Fab />
    </>
  );
}

const StyledDesktopLayout = styled(DesktopLayout)`
  font-family: 'Yu Gothic Medium', YuGothic, 'Noto Sans JP', メイリオ;
  background-color: #fff;
  color: var(--🐸foreground);
  border-color: color-mix(in oklab, var(--🐸border) 70%, transparent);

  a {
    color: inherit;
    text-decoration: none;
  }

  --fc-border-color: color-mix(in oklab, var(--🐸border) 70%, transparent);
  --fc-button-bg-color: #fff;
  --fc-button-hover-bg-color: #d2e3fc;
  --fc-button-active-bg-color: #d2e3fc;
  --fc-button-border-color: transparent;
  --fc-button-hover-border-color: transparent;
  --fc-button-active-border-color: transparent;
  --fc-button-text-color: var(--🐸foreground);
  --fc-non-business-color: #6b728011;

  --fc-event-bg-color: #dbeafe;
  --fc-event-border-color: #dbeafe;
  --fc-event-text-color: #075985;
  --fc-event-hover-bg-color: #93c5fd;
  --fc-event-hover-border-color: #93c5fd;
  --fc-event-hover-text-color: #075985;
  --fc-event-active-bg-color: #93c5fd;
  --fc-event-active-border-color: #93c5fd;
  --fc-event-active-text-color: #075985;

  .fc .fc-scrollgrid,
  .fc .fc-timegrid-slot-minor {
    border-style: none;
  }

  .fc-toolbar-title {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
  }

  .fc-button {
    transition: all 250ms ease !important;
  }

  .fc .fc-button:focus {
    box-shadow: none !important;
  }

  .fc {
    .fc-col-header-cell-cushion,
    .fc-daygrid-day-number {
      color: color-mix(in oklab, var(--🐸foreground) 70%, transparent) !important;
      font-weight: 500 !important;
      font-size: 14px !important;
    }
    .fc-timegrid-slot-label-cushion,
    .fc-timegrid-axis-cushion {
      color: color-mix(in oklab, var(--🐸foreground) 50%, transparent) !important;
      font-weight: 500 !important;
      font-size: 12px !important;
      line-height: 1.5 !important;
    }

    .fc-day {
      &.fc-day-sat {
        background-color: #f1f8ff88 !important;
      }
      &.fc-day-sun {
        background-color: #fff1f288 !important;
      }
    }

    .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
      min-height: 3em;
    }
  }

  .fc-today-button {
    border: 1px solid #0004;
    background-color: #fff;
    color: #41525c;

    &:disabled {
      border: 1px solid #0002;
      color: #0006;
      background-color: #fff;
    }
  }

  .fc-event-time,
  .fc-event-title-container {
    padding: 0.1rem 0.25rem;
  }

  /*
   * MUI DateCalendar (sidebar mini calendar) resets.
   * kintone's own page styles bleed into the plugin DOM (no shadow root),
   * and its default rules for "button"/"span" width & line-height can
   * override MUI's own fixed sizing on individual axes, which breaks the
   * header label (wraps) and the day cells (circle becomes an ellipse).
   * These are re-asserted with !important to win that cascade regardless
   * of the kintone theme in use.
   */
  .MuiPickersCalendarHeader-root {
    padding-left: 8px !important;
    padding-right: 4px !important;
  }

  .MuiPickersCalendarHeader-labelContainer {
    overflow: visible !important;
  }

  .MuiPickersCalendarHeader-label {
    white-space: nowrap !important;
  }

  .MuiDayCalendar-weekDayLabel,
  .MuiPickersDay-root {
    box-sizing: border-box !important;
    flex-shrink: 0 !important;
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    max-width: 28px !important;
    min-height: 28px !important;
    max-height: 28px !important;
    line-height: 28px !important;
    padding: 0 !important;
    margin: 0 2px !important;
  }

  .MuiPickersDay-root {
    border-radius: 50% !important;
  }
`;

export default function DesktopApp() {
  return (
    <Provider store={store}>
      <PluginErrorBoundary>
        <Suspense fallback={<LoaderWithLabel label={t('desktop.loading.default')} />}>
          <SnackbarProvider maxSnack={1}>
            <ThemeProvider theme={createTheme({}, jaJP)}>
              <StyledDesktopLayout />
            </ThemeProvider>
          </SnackbarProvider>
        </Suspense>
      </PluginErrorBoundary>
    </Provider>
  );
}
