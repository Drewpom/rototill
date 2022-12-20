
export const convertPathToOpenAPIFormat = (path: string): string => {
  const regex = new RegExp('(?:\\:(?!\\/)([a-zA-Z]+))', 'gm')
  const subst = `{$1}`;

  return path.replace(regex, subst);
}
