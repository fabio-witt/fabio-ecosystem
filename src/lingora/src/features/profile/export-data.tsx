import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Platform } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

/** "Download my data": everything GrammarBay stores about you as a JSON file. */
export function ExportDataButton() {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function exportData() {
    setState('busy');
    const { data, error } = await supabase.rpc('export_my_data');
    if (error || !data) {
      setState('error');
      return;
    }
    const json = JSON.stringify(data, null, 2);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `lingora-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      await Clipboard.setStringAsync(json);
    }
    setState('done');
  }

  return (
    <>
      <Button title={t('Download my data')} variant="secondary" loading={state === 'busy'} onPress={() => void exportData()} />
      {state === 'done' ? (
        <AppText variant="caption" color="success">
          {Platform.OS === 'web' ? t('Your data was downloaded as a JSON file.') : t('Your data was copied to the clipboard as JSON.')}
        </AppText>
      ) : null}
      {state === 'error' ? <AppText variant="caption" color="danger">{t('The export did not work. Check your connection and try again.')}</AppText> : null}
    </>
  );
}
