import styles from '../chatStyles';

describe('chat inbox layout', () => {
  it('keeps each conversation row horizontal so its copy stays visible beside the avatar', () => {
    expect(styles.conversationRow).toEqual(expect.stringContaining('flex-row'));
  });

  it('does not let the conversation metadata stretch the row to the viewport height', () => {
    expect(styles.rowMeta).not.toEqual(expect.stringContaining('h-full'));
  });
});
