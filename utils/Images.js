export const getRegionImage = region => {
  switch (region) {
    case "US_ALASKA":
      return require(`../assets/US_MAP/US_ALASKA.png`);
    case "US_HAWAII":
      return require(`../assets/US_MAP/US_HAWAII.png`);
    case "US_CALIFORNIA":
      return require(`../assets/US_MAP/US_CALIFORNIA.png`);
    case "US_CENTRAL":
      return require(`../assets/US_MAP/US_CENTRAL.png`);
    case "US_DMV":
      return require(`../assets/US_MAP/US_DMV.png`);
    case "US_MIDWEST":
      return require(`../assets/US_MAP/US_MIDWEST.png`);
    case "US_MOUNTAIN":
      return require(`../assets/US_MAP/US_MOUNTAIN.png`);
    case "US_NORTHEAST":
      return require(`../assets/US_MAP/US_NORTHEAST.png`);
    case "US_SOUTH":
      return require(`../assets/US_MAP/US_SOUTH.png`);
    case "US_SOUTHEAST":
      return require(`../assets/US_MAP/US_SOUTHEAST.png`);
    case "US_NORTHWEST":
      return require(`../assets/US_MAP/US_NORTHWEST.png`);
    default:
      require(`../assets/US_MAP/US_BG.png`);
  }
};
