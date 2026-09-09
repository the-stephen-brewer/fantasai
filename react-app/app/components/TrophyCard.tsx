import { useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { DraftAward } from '../models';
import { awardConfig } from './awardConfig';
import * as Heroicons from '@heroicons/react/24/solid';
import * as MuiIcons from '@mui/icons-material';
import SVG from 'react-inlinesvg';
import ShareButton from './ShareButton';

interface TrophyCardProps {
  award: DraftAward;
  leagueName?: string;
  currentUserDisplayName?: string | null;
}

const getIconComponent = (iconName: string) => {
  const localSvgIcons = ['spy','grim','toilet','crystalball','god'];
  const localPNGs = ['ryanleaf'];
  if (iconName in Heroicons) return Heroicons[iconName as keyof typeof Heroicons];
  if (iconName in MuiIcons) return MuiIcons[iconName as keyof typeof MuiIcons];
  if (localSvgIcons.includes(iconName)) return `/svgs/${iconName}.svg`;
  if (localPNGs.includes(iconName)) return `/svgs/${iconName}.png`;
  return Heroicons.QuestionMarkCircleIcon;
};

const IconWrapper = ({ component: Icon, ...props }: { component: React.ElementType, [key: string]: any }) => {
  if (typeof Icon === 'string' && Icon.endsWith('.svg')) return <SVG src={Icon} {...props} />;
  if (typeof Icon === 'string' && Icon.endsWith('.png')) return <img src={Icon} alt="" {...props} />;
  const isMuiIcon = (Icon as any).muiName === 'MuiSvgIcon';
  if (isMuiIcon) {
    const { width: _w, height: _h, ...rest } = props;
    return <Icon fontSize="large" {...rest} />;
  }
  return <Icon {...props} />;
};

export default function TrophyCard({ award, leagueName, currentUserDisplayName }: TrophyCardProps) {
  const config = awardConfig[award.award_title];
  if (!config) return <div>Missing award config for {award.award_title}</div>;
  
  const IconComponent = getIconComponent(config.icon);

  const contextMatch = award.award_context.match(/(.*) \((.*): (.*)\)/);
  let contextData = null;
  if (contextMatch) {
    contextData = { player: contextMatch[1], label: contextMatch[2], value: contextMatch[3] };
  }

  return (
    <Card sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      p: 2,
    }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'center', p: 0, '&:last-child': { pb: 0 } }}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Box sx={{ width: 40 }} /> {/* Spacer */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, filter: `drop-shadow(0 0 12px ${config.color || 'rgba(0, 255, 255, 0.5)'})` }}>
              <IconWrapper component={IconComponent} className={config.colorClass} style={{ width: '6rem', height: '6rem' }} />
            </Box>
            <ShareButton
              currentUserDisplayName={currentUserDisplayName}
              awardName={award.award_title}
              userDisplayName={award.user_display_name}
              leagueName={leagueName}
              awardDescription={award.award_description}
              awardContext={award.award_context}
            />
          </Box>
          <Typography variant="h5" component="div" fontWeight="700" sx={{ mb: 0.25, wordBreak: 'break-word', whiteSpace: 'normal' }}>
            {award.award_title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Awarded to: {award.user_display_name}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {award.award_description}
          </Typography>
        </Box>

        {contextData ? (
          <Box sx={{ mt: 'auto', background: 'rgba(0,0,0,0.2)', p: 1.5, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <div><strong>Player:</strong> {contextData.player}</div>
            <div><strong>{contextData.label}:</strong> {contextData.value}</div>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ background: 'rgba(0,0,0,0.2)', p: 1, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {award.award_context}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
