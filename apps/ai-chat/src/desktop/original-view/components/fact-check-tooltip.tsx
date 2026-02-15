import { t } from '@/lib/i18n';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import GppBadIcon from '@mui/icons-material/GppBad';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SecurityIcon from '@mui/icons-material/Security';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Box, Card, CardContent, Link, Typography, alpha } from '@mui/material';
import { FactCheckResult } from '../states/fact-check';

interface Props {
  result: FactCheckResult;
}

const COLORS = {
  trusted: {
    primary: '#1b5e20',
    secondary: '#2e7d32',
    bg: '#e8f5e9',
    border: '#a5d6a7',
  },
  caution: {
    primary: '#e65100',
    secondary: '#f57c00',
    bg: '#fff3e0',
    border: '#ffcc80',
  },
  inaccurate: {
    primary: '#b71c1c',
    secondary: '#c62828',
    bg: '#ffebee',
    border: '#ef9a9a',
  },
  skipped: {
    primary: '#424242',
    secondary: '#616161',
    bg: '#fafafa',
    border: '#bdbdbd',
  },
};

export default function FactCheckTooltip({ result }: Props) {
  const level = result.level as keyof typeof COLORS;
  const colors = COLORS[level] || COLORS.skipped;

  const getStatusIcon = () => {
    switch (result.level) {
      case 'trusted':
        return <VerifiedUserIcon sx={{ fontSize: 32, color: colors.primary }} />;
      case 'caution':
        return <GppMaybeIcon sx={{ fontSize: 32, color: colors.primary }} />;
      case 'inaccurate':
        return <GppBadIcon sx={{ fontSize: 32, color: colors.primary }} />;
      default:
        return <SecurityIcon sx={{ fontSize: 32, color: colors.primary }} />;
    }
  };

  const getStatusLabel = () => {
    switch (result.level) {
      case 'trusted':
        return t('factCheck.status.trusted');
      case 'caution':
        return t('factCheck.status.caution');
      case 'skipped':
        return t('factCheck.status.skipped');
      default:
        return t('factCheck.status.inaccurate');
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'correct':
        return <TaskAltIcon sx={{ fontSize: 16, color: COLORS.trusted.primary }} />;
      case 'uncertain':
        return <ReportProblemIcon sx={{ fontSize: 16, color: COLORS.caution.primary }} />;
      case 'incorrect':
        return <DoNotDisturbAltIcon sx={{ fontSize: 16, color: COLORS.inaccurate.primary }} />;
      default:
        return null;
    }
  };

  const getVerdictColors = (verdict: string) => {
    switch (verdict) {
      case 'correct':
        return COLORS.trusted;
      case 'uncertain':
        return COLORS.caution;
      case 'incorrect':
        return COLORS.inaccurate;
      default:
        return COLORS.skipped;
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 480,
        maxHeight: 450,
        overflowY: 'auto',
        borderRadius: 1,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 4px 20px ${alpha(colors.primary, 0.2)}`,
        // background: `linear-gradient(180deg, ${colors.bg} 0%, #ffffff 100%)`,
        background: '#fff',
      }}
    >
      {/* Header - Certificate Style */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `3px solid ${alpha(colors.primary, 0.3)}`,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          {getStatusIcon()}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              mb: 0.25,
            }}
          >
            VERIFICATION STATUS
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            {getStatusLabel()}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: 2 }}>
        {/* Summary Section */}
        <Box
          sx={{
            bgcolor: alpha(colors.border, 0.2),
            borderRadius: 1,
            p: 1.5,
            mb: 2,
            borderLeft: `3px solid ${colors.primary}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: 'text.primary',
            }}
          >
            {result.summary}
          </Typography>
        </Box>

        {/* Details Section */}
        {result.details && result.details.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'text.secondary',
                mb: 1.5,
              }}
            >
              DETAILED FINDINGS
            </Typography>

            {[...result.details]
              .sort((a, b) => {
                const order = { incorrect: 0, uncertain: 1, correct: 2 };
                return (
                  (order[a.verdict as keyof typeof order] ?? 3) -
                  (order[b.verdict as keyof typeof order] ?? 3)
                );
              })
              .map((detail, index) => {
                const verdictColors = getVerdictColors(detail.verdict);
                return (
                  <Box
                    key={index}
                    sx={{
                      mb: index < result.details!.length - 1 ? 1.5 : 0,
                      p: 1.5,
                      bgcolor: alpha(verdictColors.bg, 0.5),
                      borderRadius: 1,
                      border: `1px solid ${alpha(verdictColors.border, 0.5)}`,
                    }}
                  >
                    <Box display='flex' alignItems='flex-start' gap={1} mb={0.75}>
                      <Box
                        sx={{
                          mt: 0.25,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          bgcolor: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${verdictColors.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {getVerdictIcon(detail.verdict)}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: verdictColors.primary,
                          lineHeight: 1.4,
                        }}
                      >
                        {detail.claim}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        lineHeight: 1.5,
                        pl: 3.5,
                      }}
                    >
                      {detail.explanation}
                    </Typography>

                    {detail.correction && (
                      <Box
                        sx={{
                          mt: 1,
                          pl: 3.5,
                          py: 0.75,
                          px: 1,
                          bgcolor: alpha(COLORS.trusted.primary, 0.08),
                          borderRadius: 0.5,
                          borderLeft: `2px solid ${COLORS.trusted.primary}`,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: COLORS.trusted.primary,
                          }}
                        >
                          {t('factCheck.verification.correction')}:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: COLORS.trusted.secondary,
                          }}
                        >
                          {detail.correction}
                        </Typography>
                      </Box>
                    )}

                    {detail.sources && detail.sources.length > 0 && (
                      <Box sx={{ mt: 1, pl: 3.5 }}>
                        <Typography
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            mb: 0.5,
                          }}
                        >
                          {t('factCheck.verification.sources')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {detail.sources.map((source, i) => (
                            <Link
                              key={i}
                              href={source}
                              target='_blank'
                              rel='noopener noreferrer'
                              sx={{
                                fontSize: '0.7rem',
                                color: colors.primary,
                                textDecoration: 'none',
                                px: 0.75,
                                py: 0.25,
                                bgcolor: alpha(colors.primary, 0.08),
                                borderRadius: 0.5,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: alpha(colors.primary, 0.15),
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {new URL(source).hostname}
                            </Link>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
