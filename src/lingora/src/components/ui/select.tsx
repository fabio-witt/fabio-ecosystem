import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { t } from '@/lib/i18n';

type SelectProps = {
  label: string;
  options: readonly string[];
  /** Selected values. Single-select uses at most one entry. */
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  max?: number;
  placeholder?: string;
};

/** Dropdown field that opens a list of predefined answers. */
export function Select({ label, options, value, onChange, multiple = false, max, placeholder = 'Choose…' }: SelectProps) {
  const { styles } = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  // Keep older free-text answers selectable so nothing silently disappears.
  const allOptions = [...options, ...value.filter((item) => !options.includes(item))];
  const limitReached = multiple && max !== undefined && value.length >= max;

  function toggle(option: string) {
    if (!multiple) {
      onChange(value[0] === option ? [] : [option]);
      setOpen(false);
      return;
    }
    if (value.includes(option)) onChange(value.filter((item) => item !== option));
    else if (!limitReached) onChange([...value, option]);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label + ': ' + (value.length ? value.map(item => t(item)).join(', ') : t('not set'))}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <AppText variant="body" color={value.length ? 'text' : 'textMuted'} numberOfLines={2} style={styles.flex}>
          {value.length ? value.join(', ') : placeholder}
        </AppText>
        <AppText variant="body" color="textMuted">▾</AppText>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t("Close")} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="heading" style={styles.flex}>{label}</AppText>
            {multiple ? <Button title={t("Done")} size="sm" onPress={() => setOpen(false)} /> : null}
          </View>
          {multiple && max ? (
            <AppText variant="caption" color="textSecondary" style={styles.hint}>
              {t('Choose up to {max}. {n} selected.', { max, n: value.length })}
            </AppText>
          ) : null}
          <FlatList
            data={allOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const selected = value.includes(item);
              const disabled = !selected && limitReached;
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  disabled={disabled}
                  accessibilityRole={multiple ? 'checkbox' : 'radio'}
                  accessibilityState={{ checked: selected, disabled }}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed, disabled && styles.disabled]}
                >
                  <AppText variant="body" style={styles.flex}>{t(item)}</AppText>
                  <AppText variant="heading" color="primary">{selected ? '✓' : ''}</AppText>
                </Pressable>
              );
            }}
          />
          {value.length ? (
            <Button title={t("Clear selection")} variant="ghost" size="sm" onPress={() => onChange([])} />
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 50,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '75%', backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  hint: { paddingHorizontal: screenPadding, paddingBottom: spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: screenPadding,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle,
  },
});
