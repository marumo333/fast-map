export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

export const containerStyles = {
  base: 'w-full px-4 mx-auto',
  sm: 'sm:max-w-screen-sm',
  md: 'md:max-w-screen-md',
  lg: 'lg:max-w-screen-lg',
  xl: 'xl:max-w-screen-xl',
  '2xl': '2xl:max-w-screen-2xl',
};

export const getResponsiveContainerClass = () => {
  return `${containerStyles.base} ${containerStyles.sm} ${containerStyles.md} ${containerStyles.lg} ${containerStyles.xl} ${containerStyles['2xl']}`;
};

export const mapContainerStyles = {
  base: 'w-full h-[300px]',
  sm: 'sm:h-[400px]',
  md: 'md:h-[500px]',
  lg: 'lg:h-[600px]',
};

export const getResponsiveMapContainerClass = () => {
  return `${mapContainerStyles.base} ${mapContainerStyles.sm} ${mapContainerStyles.md} ${mapContainerStyles.lg}`;
}; 