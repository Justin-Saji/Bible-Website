class LiturgicalCalendar {
  constructor() {
    this.liturgicalColors = {
      advent: "purple",
      christmas: "white",
      lent: "purple",
      easter: "white",
      ordinary_time: "green"
    };
  }

  getEasterSunday(year) {
    // Calculate Easter Sunday using the Anonymous Gregorian algorithm
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  getLiturgicalSeason(currentDate) {
    const year = currentDate.getFullYear();
    const easter = this.getEasterSunday(year);

    // Advent (4 Sundays before Christmas)
    const christmas = new Date(year, 11, 25);
    const adventStart = new Date(christmas);
    adventStart.setDate(christmas.getDate() - 27);

    if (currentDate >= adventStart && currentDate <= christmas) {
      return "advent";
    }

    // Christmas Season (Dec 25 - Jan 6 + Baptism of Lord)
    const epiphany = new Date(christmas.getMonth() === 11 ? year + 1 : year, 0, 6);
    const baptismOfLord = new Date(epiphany);
    baptismOfLord.setDate(epiphany.getDate() + 7);

    // Christmas season: Dec 25 to Jan 13 (Baptism of Lord)
    if ((currentDate.getMonth() === 11 && currentDate.getDate() >= 25) ||
        (currentDate.getMonth() === 0 && currentDate.getDate() <= 13)) {
      return "christmas";
    }

    // Lent (Ash Wednesday to Holy Saturday)
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);

    if (currentDate >= ashWednesday && currentDate < easter) {
      return "lent";
    }

    // Easter Season (Easter Sunday to Pentecost)
    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);

    if (currentDate >= easter && currentDate <= pentecost) {
      return "easter";
    }

    // Ordinary Time
    return "ordinary_time";
  }

  getFeastDays(currentDate) {
    const feastDays = [];

    // Fixed feast days
    const fixedFeasts = {
      "1-1": { name: "Solemnity of Mary, Mother of God", type: "solemnity" },
      "1-6": { name: "Epiphany of the Lord", type: "feast" },
      "2-2": { name: "Presentation of the Lord", type: "feast" },
      "3-19": { name: "St. Joseph, Husband of Mary", type: "solemnity" },
      "3-25": { name: "Annunciation of the Lord", type: "solemnity" },
      "4-25": { name: "St. Mark, Evangelist", type: "feast" },
      "5-1": { name: "St. Joseph the Worker", type: "memorial" },
      "6-24": { name: "Nativity of St. John the Baptist", type: "solemnity" },
      "6-29": { name: "Sts. Peter and Paul, Apostles", type: "solemnity" },
      "8-15": { name: "Assumption of Mary", type: "solemnity" },
      "9-14": { name: "Exaltation of the Holy Cross", type: "feast" },
      "10-2": { name: "Guardian Angels", type: "memorial" },
      "11-1": { name: "All Saints", type: "solemnity" },
      "11-2": { name: "All Souls", type: "commemoration" },
      "12-8": { name: "Immaculate Conception", type: "solemnity" },
      "12-12": { name: "Our Lady of Guadalupe", type: "memorial" },
      "12-25": { name: "Nativity of the Lord (Christmas)", type: "solemnity" },
      "12-26": { name: "St. Stephen, First Martyr", type: "feast" },
      "12-27": { name: "St. John, Apostle and Evangelist", type: "feast" },
      "12-28": { name: "Holy Innocents", type: "feast" }
    };

    const monthDay = `${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
    if (fixedFeasts[monthDay]) {
      feastDays.push(fixedFeasts[monthDay]);
    }

    // Moveable feasts based on Easter
    const year = currentDate.getFullYear();
    const easter = this.getEasterSunday(year);

    const moveableFeasts = {};
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(easter.getDate() - 46);
    moveableFeasts[ashWednesday.toISOString().split('T')[0]] = { name: "Ash Wednesday", type: "commemoration" };

    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);
    moveableFeasts[palmSunday.toISOString().split('T')[0]] = { name: "Palm Sunday", type: "solemnity" };

    const holyThursday = new Date(easter);
    holyThursday.setDate(easter.getDate() - 3);
    moveableFeasts[holyThursday.toISOString().split('T')[0]] = { name: "Holy Thursday", type: "solemnity" };

    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    moveableFeasts[goodFriday.toISOString().split('T')[0]] = { name: "Good Friday", type: "solemnity" };

    const holySaturday = new Date(easter);
    holySaturday.setDate(easter.getDate() - 1);
    moveableFeasts[holySaturday.toISOString().split('T')[0]] = { name: "Holy Saturday", type: "solemnity" };

    moveableFeasts[easter.toISOString().split('T')[0]] = { name: "Easter Sunday", type: "solemnity" };

    const pentecost = new Date(easter);
    pentecost.setDate(easter.getDate() + 49);
    moveableFeasts[pentecost.toISOString().split('T')[0]] = { name: "Pentecost Sunday", type: "solemnity" };

    const trinity = new Date(easter);
    trinity.setDate(easter.getDate() + 56);
    moveableFeasts[trinity.toISOString().split('T')[0]] = { name: "Most Holy Trinity", type: "solemnity" };

    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    moveableFeasts[corpusChristi.toISOString().split('T')[0]] = { name: "Body and Blood of Christ", type: "solemnity" };

    const currentDateStr = currentDate.toISOString().split('T')[0];
    if (moveableFeasts[currentDateStr]) {
      feastDays.push(moveableFeasts[currentDateStr]);
    }

    return feastDays;
  }

  getDailyImportance(currentDate) {
    const feastDays = this.getFeastDays(currentDate);
    const season = this.getLiturgicalSeason(currentDate);

    let importanceMessage = "";
    let hasSignificance = false;

    if (feastDays.length > 0) {
      const primaryFeast = feastDays[0];
      hasSignificance = true;
      if (primaryFeast.type === "solemnity") {
        importanceMessage = `Today we celebrate the ${primaryFeast.name}, a most important solemnity in the Church.`;
      } else if (primaryFeast.type === "feast") {
        importanceMessage = `Today we honor the ${primaryFeast.name}, a significant feast day.`;
      } else {
        importanceMessage = `Today we commemorate the ${primaryFeast.name}.`;
      }
    } else {
      // Only show season message if it's a Sunday
      if (currentDate.getDay() === 0) {
        hasSignificance = true;
        const seasonMessages = {
          advent: "Today is a Sunday in the Advent season, a time of preparation and waiting for the coming of Christ.",
          christmas: "Today is a Sunday in the Christmas season, celebrating the birth of our Lord Jesus Christ.",
          lent: "Today is a Sunday in the Lenten season, a time of prayer, fasting, and almsgiving in preparation for Easter.",
          easter: "Today is a Sunday in the Easter season, celebrating the resurrection of Christ and our salvation.",
          ordinary_time: "Today is a Sunday in Ordinary Time, growing in our understanding of Christ's teachings."
        };
        importanceMessage = seasonMessages[season] || "Today is a Sunday to grow in faith and devotion.";
      }
    }

    return {
      season: hasSignificance ? season : "",
      color: hasSignificance ? this.liturgicalColors[season] || "green" : "",
      feastDays: feastDays,
      importanceMessage: importanceMessage,
      hasSignificance: hasSignificance
    };
  }
}

module.exports = LiturgicalCalendar;
