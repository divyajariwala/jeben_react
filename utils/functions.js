import * as CountriesList from "countries-list";
import _ from "lodash";

export const generateInvitationLink = () => {
  //generate 4 random alphanumeric
  var S4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  //return 2 sets of those
  return S4() + S4();
};

export const formatNumberWithCommas = number => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const isNameValid = name => {
  let regEx = /[ \d!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/;

  return name.length >= 2 && name.length <= 15 && !regEx.test(name);
};

export const cleanName = name => {
  let emojisRemoved = name.replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
    ""
  );
  return emojisRemoved.trim();
};

export const getZodiacSign = (day, month) => {
  let zodiacSigns = {
    capricorn: "zodiac-capricorn",
    aquarius: "zodiac-aquarius",
    pisces: "zodiac-pisces",
    aries: "zodiac-aries",
    taurus: "zodiac-taurus",
    gemini: "zodiac-gemini",
    cancer: "zodiac-cancer",
    leo: "zodiac-leo",
    virgo: "zodiac-virgo",
    libra: "zodiac-libra",
    scorpio: "zodiac-scorpio",
    sagittarius: "zodiac-sagittarius"
  };

  if ((month === 1 && day <= 20) || (month === 12 && day >= 22)) {
    return zodiacSigns.capricorn;
  } else if ((month === 1 && day >= 21) || (month === 2 && day <= 18)) {
    return zodiacSigns.aquarius;
  } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return zodiacSigns.pisces;
  } else if ((month === 3 && day >= 21) || (month === 4 && day <= 20)) {
    return zodiacSigns.aries;
  } else if ((month === 4 && day >= 21) || (month === 5 && day <= 20)) {
    return zodiacSigns.taurus;
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return zodiacSigns.gemini;
  } else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) {
    return zodiacSigns.cancer;
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 23)) {
    return zodiacSigns.leo;
  } else if ((month === 8 && day >= 24) || (month === 9 && day <= 23)) {
    return zodiacSigns.virgo;
  } else if ((month === 9 && day >= 24) || (month === 10 && day <= 23)) {
    return zodiacSigns.libra;
  } else if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) {
    return zodiacSigns.scorpio;
  } else if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) {
    return zodiacSigns.sagittarius;
  }
};

export const getCountriesList = () => {
  return [
    {
      name: "",
      id: 0,
      children: [
        {
          name: "🇪🇹 Ethiopian",
          id: "ET"
        },
        {
          name: "🇪🇷 Eritrean",
          id: "ER"
        },
        {
          name: "🌐 Other",
          id: "OTH"
        }
      ]
    }
  ];
};

export const getOccupationsList = () => {
  return [
    {
      name: "",
      id: 0,
      children: [
        {
          name: "Software Developer",
          id: 1
        },
        {
          name: "Business Analyst",
          id: 2
        }
      ]
    }
  ];
};

export const getLocationName = location => {
  let NAME_MAPPING = {
    US_NORTHEAST: "US - Northeast",
    US_DMV: "US - DMV",
    US_SOUTHEAST: "US - Southeast",
    US_MIDWEST: "US - Midwest",
    US_CENTRAL: "US - Central",
    US_MOUNTAIN: "US - Mountain",
    US_SOUTH: "US - South",
    US_NORTHWEST: "US - Northwest",
    US_ALASKA: "US - Alaska",
    US_HAWAII: "US - Hawaii",
    US_CALIFORNIA: "US - California"
  };
  return NAME_MAPPING[location];
};

export const getLocationsList = () => {
  return [
    {
      name: "",
      id: 0,
      children: [
        {
          name: "US - Northeast",
          id: "US_NORTHEAST"
        },
        {
          name: "US - DMV",
          id: "US_DMV"
        },
        {
          name: "US - Southeast",
          id: "US_SOUTHEAST"
        },
        {
          name: "US - Midwest",
          id: "US_MIDWEST"
        },
        {
          name: "US - Central",
          id: "US_CENTRAL"
        },
        {
          name: "US - Mountain",
          id: "US_MOUNTAIN"
        },
        {
          name: "US - South",
          id: "US_SOUTH"
        },
        {
          name: "US - Southwest",
          id: "US_SOUTHWEST"
        },
        {
          name: "US - Northwest",
          id: "US_NORTHWEST"
        },
        {
          name: "US - Alaska",
          id: "US_ALASKA"
        },
        {
          name: "US - Hawaii",
          id: "US_HAWAII"
        },
        {
          name: "Canada",
          id: "CANADA"
        },
        {
          name: "Europe",
          id: "EUROPE"
        },
        {
          name: "Any",
          id: "ANY"
        }
      ]
    }
  ];
};

export const getLocationsList2 = availableRegions => {
  let FILTERED_LIST = [];
  //Add any to preference list
  FILTERED_LIST.push({
    name: "🌍 Any",
    id: "ANY"
  });
  //Filter available US states
  let US_STATES = [
    {
      name: "🇺🇸 US - Northeast",
      id: "US_NORTHEAST"
    },
    {
      name: "🇺🇸 US - DMV",
      id: "US_DMV"
    },
    {
      name: "🇺🇸 US - Southeast",
      id: "US_SOUTHEAST"
    },
    {
      name: "🇺🇸 US - Midwest",
      id: "US_MIDWEST"
    },
    {
      name: "🇺🇸 US - Central",
      id: "US_CENTRAL"
    },
    {
      name: "🇺🇸 US - Mountain",
      id: "US_MOUNTAIN"
    },
    {
      name: "🇺🇸 US - South",
      id: "US_SOUTH"
    },
    {
      name: "🇺🇸 US - Northwest",
      id: "US_NORTHWEST"
    },
    {
      name: "🇺🇸 US - Alaska",
      id: "US_ALASKA"
    },
    {
      name: "🇺🇸 US - Hawaii",
      id: "US_HAWAII"
    },
    {
      name: "🇺🇸 US - California",
      id: "US_CALIFORNIA"
    }
  ];
  let FILTERED_US_LIST = _.filter(US_STATES, x =>
    _.includes(availableRegions, x.id)
  );
  FILTERED_US_LIST.map(region => {
    FILTERED_LIST.push(region);
  });
  //Show available Canada provinces
  let CA_PROVINCES = [
    {
      name: "🇨🇦 Canada - Alberta",
      id: "CA_AB"
    },
    {
      name: "🇨🇦 Canada - British Columbia",
      id: "CA_BC"
    },
    {
      name: "🇨🇦 Canada - Manitoba",
      id: "CA_MB"
    },
    {
      name: "🇨🇦 Canada - New Brunswick",
      id: "CA_NB"
    },
    {
      name: "🇨🇦 Canada - Newfoundland",
      id: "CA_NL"
    },
    {
      name: "🇨🇦 Canada - Nova Scotia",
      id: "CA_NS"
    },
    {
      name: "🇨🇦 Canada - Ontario",
      id: "CA_ON"
    },
    {
      name: "🇨🇦 Canada - PE",
      id: "CA_PE"
    },
    {
      name: "🇨🇦 Canada - Quebec",
      id: "CA_QC"
    },
    {
      name: "🇨🇦 Canada - Saskatchewan",
      id: "CA_SK"
    }
  ];
  let FILTERED_CA_LIST = _.filter(CA_PROVINCES, x =>
    _.includes(availableRegions, x.id)
  );
  FILTERED_CA_LIST.map(region => {
    FILTERED_LIST.push(region);
  });
  //Show available Countries
  availableRegions.map(region => {
    if (CountriesList.countries[region]) {
      FILTERED_LIST.push({
        name: `${CountriesList.countries[region].emoji} ${
          CountriesList.countries[region].name
        }`,
        id: region
      });
    }
  });
  console.log("FILTERED: ", FILTERED_LIST);
  //return the final filtered list
  return FILTERED_LIST;
};

const getUSRegionID = location => {
  const LOCATION_ID_MAP = {
    //10
    Maine: "US_NORTHEAST",
    "New Hampshire": "US_NORTHEAST",
    Vermont: "US_NORTHEAST",
    Massachusetts: "US_NORTHEAST",
    "Rhode Island": "US_NORTHEAST",
    Connecticut: "US_NORTHEAST",
    "New York": "US_NORTHEAST",
    "New Jersey": "US_NORTHEAST",
    Pennsylvania: "US_NORTHEAST",
    Delaware: "US_NORTHEAST",
    //7
    "West Virginia": "US_MIDWEST",
    Ohio: "US_MIDWEST",
    Kentucky: "US_MIDWEST",
    Michigan: "US_MIDWEST",
    Indiana: "US_MIDWEST",
    Wisconsin: "US_MIDWEST",
    Illinois: "US_MIDWEST",
    //7
    Minnesota: "US_CENTRAL",
    Iowa: "US_CENTRAL",
    Missouri: "US_CENTRAL",
    "North Dakota": "US_CENTRAL",
    "South Dakota": "US_CENTRAL",
    Nebraska: "US_CENTRAL",
    Kansas: "US_CENTRAL",
    //3
    "District of Columbia": "US_DMV",
    Maryland: "US_DMV",
    Virginia: "US_DMV",
    //7
    "North Carolina": "US_SOUTHEAST",
    "South Carolina": "US_SOUTHEAST",
    Tennessee: "US_SOUTHEAST",
    Georgia: "US_SOUTHEAST",
    Florida: "US_SOUTHEAST",
    Alabama: "US_SOUTHEAST",
    Mississippi: "US_SOUTHEAST",
    //6
    Arkansas: "US_SOUTH",
    Louisiana: "US_SOUTH",
    Texas: "US_SOUTH",
    Oklahoma: "US_SOUTH",
    "New Mexico": "US_SOUTH",
    Arizona: "US_SOUTH",
    //6
    Montana: "US_MOUNTAIN",
    Idaho: "US_MOUNTAIN",
    Wyoming: "US_MOUNTAIN",
    Colorado: "US_MOUNTAIN",
    Utah: "US_MOUNTAIN",
    Nevada: "US_MOUNTAIN",
    //1
    California: "US_CALIFORNIA",
    //4
    Oregon: "US_NORTHWEST",
    Washington: "US_NORTHWEST",
    //2
    Alaska: "US_ALASKA",
    Hawaii: "US_HAWAII"
  };
  return LOCATION_ID_MAP[location];
};

export const getUSRegionName = location => {
  let NAME_MAPPING = {
    US_NORTHEAST: "🇺🇸 US - Northeast",
    US_DMV: "🇺🇸 US - DMV",
    US_SOUTHEAST: "🇺🇸 US - Southeast",
    US_MIDWEST: "🇺🇸 US - Midwest",
    US_CENTRAL: "🇺🇸 US - Central",
    US_MOUNTAIN: "🇺🇸 US - Mountain",
    US_SOUTH: "🇺🇸 US - South",
    US_NORTHWEST: "🇺🇸 US - Northwest",
    US_ALASKA: "🇺🇸 US - Alaska",
    US_HAWAII: "🇺🇸 US - Hawaii",
    US_CALIFORNIA: "🇺🇸 US - California"
  };
  return NAME_MAPPING[location] ? NAME_MAPPING[location] : "🇺🇸 US";
};

export const getCanadaProvinceName = location => {
  let NAME_MAPPING = {
    CA_AB: "🇨🇦 Canada - Alberta",
    CA_BC: "🇨🇦 Canada - British Columbia",
    CA_MB: "🇨🇦 Canada - Manitoba",
    CA_NB: "🇨🇦 Canada - New Brunswick",
    CA_NL: "🇨🇦 Canada - Newfoundland",
    CA_NS: "🇨🇦 Canada - Nova Scotia",
    CA_ON: "🇨🇦 Canada - Ontario",
    CA_PE: "🇨🇦 Canada - PE",
    CA_QC: "🇨🇦 Canada - Quebec",
    CA_SK: "🇨🇦 Canada - Saskatchewan"
  };
  return NAME_MAPPING[location] ? NAME_MAPPING[location] : "🇨🇦 Canada";
};

export const parseAddress = address_components => {
  const country = address_components.filter(x => x.types.includes("country"))[0]
    .short_name;
  if (country === "US") {
    const state = address_components.filter(x =>
      x.types.includes("administrative_area_level_1")
    )[0].long_name;
    return getUSRegionID(state);
  } else if (country === "CA") {
    const province = address_components.filter(x =>
      x.types.includes("administrative_area_level_1")
    )[0].short_name;
    return "CA_" + province;
  }
  return country;
};

export const parseCity = address_components => {
  let city = address_components.filter(x => x.types.includes("locality"))[0]
    .long_name;
  let state = address_components.filter(x =>
    x.types.includes("administrative_area_level_1")
  )[0].short_name;
  if (!city || city === undefined) city = "";
  let cityAndState = state ? `${city}, ${state}` : `${city}`;

  return cityAndState;
};

export const getReligionsList = () => {
  return [
    {
      name: "",
      id: 0,
      children: [
        {
          name: "⛪️ Christian",
          id: 1
        },
        {
          name: "🕌 Muslim",
          id: 2
        }
      ]
    }
  ];
};

export const getPersonalitiesList = () => {
  return [
    {
      name: "",
      id: 0,
      children: [
        {
          name: "Reserved",
          id: "RESERVED"
        },
        {
          name: "Outgoing",
          id: "OUTGOING"
        },
        {
          name: "Friendly",
          id: "FRIENDLY"
        },
        {
          name: "Low-key",
          id: "LOWKEY"
        },
        {
          name: "Independent",
          id: "INDEPENDENT"
        },
        {
          name: "Deep",
          id: "DEEP"
        },
        {
          name: "Mellow",
          id: "MELLOW"
        },
        {
          name: "Goofy",
          id: "GOOFY"
        },
        {
          name: "Easy-going",
          id: "EASYGOING"
        },
        {
          name: "Organized",
          id: "ORGANIZED"
        },
        {
          name: "Ambitious",
          id: "AMBITIOUS"
        },
        {
          name: "Calm",
          id: "CALM"
        },
        {
          name: "Care-free",
          id: "CAREFREE"
        },
        {
          name: "Tense",
          id: "TENSE"
        },
        {
          name: "Adventurous",
          id: "ADVENTUROUS"
        },
        {
          name: "Confident",
          id: "CONFIDENT"
        },
        {
          name: "Trusting",
          id: "TRUSTING"
        },
        {
          name: "Miskeen",
          id: "MISKEEN"
        },
        {
          name: "Balege",
          id: "BALEGE"
        }
      ]
    }
  ];
};

export const getProductPrice = product => {
  switch (product) {
    case "app.jebena.buy.3hearts1likes":
      return {
        hearts: 3,
        likes: 3
      };
    case "app.jebena.buy.10hearts3likes":
      return {
        hearts: 10,
        likes: 10
      };
    case "app.jebena.buy.25hearts6likes":
      return {
        hearts: 25,
        likes: 25
      };
    default:
      return { hearts: 0, likes: 0 };
  }
};

export const getProductDescription = product => {
  switch (product.productId) {
    case "app.jebena.buy.3hearts1likes":
      return {
        hearts: "3 hearts",
        likes: "3 people"
      };
    case "app.jebena.buy.10hearts3likes":
      return {
        hearts: "10 hearts",
        likes: "10 people"
      };
    case "app.jebena.buy.25hearts6likes":
      return {
        hearts: "25 hearts",
        likes: "25 people"
      };
    default:
      return { hearts: "", likes: "" };
  }
};

export const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
