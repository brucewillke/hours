// Liturgical Calendar Calculator
// Calculates liturgical seasons, feast days, and daily office hours

const LiturgicalCalendar = {
    // Liturgical seasons with their colors
    SEASONS: {
        ADVENT: { name: 'Advent', color: '#5c3d7a' },
        CHRISTMAS: { name: 'Christmas', color: '#ffffff' },
        EPIPHANY: { name: 'Epiphany', color: '#ffffff' },
        ORDINARY_EARLY: { name: 'Ordinary Time', color: '#2e7d32' },
        LENT: { name: 'Lent', color: '#5c3d7a' },
        HOLY_WEEK: { name: 'Holy Week', color: '#8b0000' },
        EASTER: { name: 'Easter', color: '#ffd700' },
        ORDINARY_LATE: { name: 'Ordinary Time', color: '#2e7d32' }
    },

    // Calculate Easter Sunday using the Anonymous Gregorian algorithm
    calculateEaster(year) {
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
    },

    // Get key dates for a given year
    getKeyDates(year) {
        const easter = this.calculateEaster(year);

        return {
            // Fixed dates
            christmasEve: new Date(year, 11, 24),
            christmas: new Date(year, 11, 25),
            epiphany: new Date(year, 0, 6),

            // Easter-dependent dates
            ashWednesday: this.addDays(easter, -46),
            palmSunday: this.addDays(easter, -7),
            holyThursday: this.addDays(easter, -3),
            goodFriday: this.addDays(easter, -2),
            holySaturday: this.addDays(easter, -1),
            easter: easter,
            ascension: this.addDays(easter, 39),
            pentecost: this.addDays(easter, 49),
            trinitySunday: this.addDays(easter, 56),
            corpusChristi: this.addDays(easter, 60),

            // Advent (4 Sundays before Christmas)
            advent1: this.getAdventStart(year)
        };
    },

    // Get the start of Advent (4th Sunday before Christmas)
    getAdventStart(year) {
        const christmas = new Date(year, 11, 25);
        const christmasDay = christmas.getDay();
        // Days to go back to get to Sunday before Christmas
        const daysToSunday = christmasDay === 0 ? 7 : christmasDay;
        // Then go back 3 more weeks for 4th Sunday of Advent
        return this.addDays(christmas, -(daysToSunday + 21));
    },

    // Add days to a date
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    // Check if two dates are the same day
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    },

    // Check if date is between two dates (inclusive)
    isBetween(date, start, end) {
        const d = date.getTime();
        const s = start.getTime();
        const e = end.getTime();
        return d >= s && d <= e;
    },

    // Get current liturgical season
    getSeason(date = new Date()) {
        const year = date.getMonth() >= 10 ? date.getFullYear() : date.getFullYear();
        const dates = this.getKeyDates(year);
        const prevYearDates = this.getKeyDates(year - 1);
        const nextYearDates = this.getKeyDates(year + 1);

        // Check for specific feast days first
        const feast = this.getFeastDay(date);
        if (feast) {
            return { ...feast, isFeast: true };
        }

        // Advent (current year or previous year if in early January)
        if (this.isBetween(date, dates.advent1, new Date(year, 11, 24))) {
            const weekNum = Math.floor((date.getTime() - dates.advent1.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return {
                ...this.SEASONS.ADVENT,
                week: weekNum,
                fullName: `${weekNum}${this.ordinalSuffix(weekNum)} Week of Advent`
            };
        }

        // Christmas Season (Dec 25 - Epiphany)
        if (this.isBetween(date, dates.christmas, new Date(year + 1, 0, 5)) ||
            this.isBetween(date, new Date(year, 11, 25), dates.epiphany)) {
            return { ...this.SEASONS.CHRISTMAS, fullName: 'Christmas Season' };
        }

        // Epiphany to day before Ash Wednesday
        if (this.isBetween(date, dates.epiphany, this.addDays(dates.ashWednesday, -1))) {
            return { ...this.SEASONS.ORDINARY_EARLY, fullName: 'Ordinary Time' };
        }

        // Lent (Ash Wednesday to Palm Sunday eve)
        if (this.isBetween(date, dates.ashWednesday, this.addDays(dates.palmSunday, -1))) {
            const weekNum = Math.floor((date.getTime() - dates.ashWednesday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return {
                ...this.SEASONS.LENT,
                week: weekNum,
                fullName: weekNum === 1 ? 'Ash Wednesday Week' : `${weekNum}${this.ordinalSuffix(weekNum)} Week of Lent`
            };
        }

        // Holy Week
        if (this.isBetween(date, dates.palmSunday, dates.holySaturday)) {
            let dayName = 'Holy Week';
            if (this.isSameDay(date, dates.palmSunday)) dayName = 'Palm Sunday';
            else if (this.isSameDay(date, dates.holyThursday)) dayName = 'Holy Thursday';
            else if (this.isSameDay(date, dates.goodFriday)) dayName = 'Good Friday';
            else if (this.isSameDay(date, dates.holySaturday)) dayName = 'Holy Saturday';
            return { ...this.SEASONS.HOLY_WEEK, fullName: dayName };
        }

        // Easter Season (Easter to Pentecost)
        if (this.isBetween(date, dates.easter, dates.pentecost)) {
            if (this.isSameDay(date, dates.easter)) {
                return { ...this.SEASONS.EASTER, fullName: 'Easter Sunday' };
            }
            if (this.isSameDay(date, dates.ascension)) {
                return { ...this.SEASONS.EASTER, fullName: 'Ascension' };
            }
            if (this.isSameDay(date, dates.pentecost)) {
                return { ...this.SEASONS.EASTER, fullName: 'Pentecost' };
            }
            const weekNum = Math.floor((date.getTime() - dates.easter.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return {
                ...this.SEASONS.EASTER,
                week: weekNum,
                fullName: `${weekNum}${this.ordinalSuffix(weekNum)} Week of Easter`
            };
        }

        // Ordinary Time (after Pentecost)
        return { ...this.SEASONS.ORDINARY_LATE, fullName: 'Ordinary Time' };
    },

    // Get feast day if applicable
    getFeastDay(date = new Date()) {
        const month = date.getMonth();
        const day = date.getDate();

        const feasts = {
            '0-1': { name: 'Solemnity of Mary', color: '#ffffff' },
            '0-6': { name: 'Epiphany', color: '#ffffff' },
            '1-2': { name: 'Presentation of the Lord', color: '#ffffff' },
            '2-19': { name: "St. Joseph's Day", color: '#ffffff' },
            '2-25': { name: 'Annunciation', color: '#ffffff' },
            '5-24': { name: 'Nativity of St. John the Baptist', color: '#ffffff' },
            '5-29': { name: 'Sts. Peter and Paul', color: '#c41e3a' },
            '7-6': { name: 'Transfiguration', color: '#ffffff' },
            '7-15': { name: 'Assumption of Mary', color: '#ffffff' },
            '8-14': { name: 'Exaltation of the Holy Cross', color: '#c41e3a' },
            '10-1': { name: 'All Saints Day', color: '#ffffff' },
            '10-2': { name: 'All Souls Day', color: '#5c3d7a' },
            '11-8': { name: 'Immaculate Conception', color: '#ffffff' },
            '11-25': { name: 'Christmas', color: '#ffffff' }
        };

        const key = `${month}-${day}`;
        return feasts[key] || null;
    },

    // Ordinal suffix helper
    ordinalSuffix(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }
};

// Daily Office / Liturgy of the Hours
const DailyOffice = {
    HOURS: {
        VIGILS: {
            name: 'Vigils (Matins)',
            latin: 'Matutinum',
            description: 'Night Office',
            startHour: 3,
            endHour: 6
        },
        LAUDS: {
            name: 'Lauds',
            latin: 'Laudes',
            description: 'Morning Prayer',
            startHour: 6,
            endHour: 9
        },
        TERCE: {
            name: 'Terce',
            latin: 'Tertia',
            description: 'Mid-Morning Prayer',
            startHour: 9,
            endHour: 12
        },
        SEXT: {
            name: 'Sext',
            latin: 'Sexta',
            description: 'Midday Prayer',
            startHour: 12,
            endHour: 15
        },
        NONE: {
            name: 'None',
            latin: 'Nona',
            description: 'Mid-Afternoon Prayer',
            startHour: 15,
            endHour: 18
        },
        VESPERS: {
            name: 'Vespers',
            latin: 'Vesperae',
            description: 'Evening Prayer',
            startHour: 18,
            endHour: 21
        },
        COMPLINE: {
            name: 'Compline',
            latin: 'Completorium',
            description: 'Night Prayer',
            startHour: 21,
            endHour: 24
        }
    },

    // Get the current liturgical hour
    getCurrentHour(date = new Date()) {
        const hour = date.getHours();

        for (const [key, office] of Object.entries(this.HOURS)) {
            if (hour >= office.startHour && hour < office.endHour) {
                return { key, ...office };
            }
        }

        // Before 3am counts as Compline (previous day's night prayer)
        if (hour < 3) {
            return { key: 'COMPLINE', ...this.HOURS.COMPLINE };
        }

        return { key: 'VIGILS', ...this.HOURS.VIGILS };
    },

    // Get all hours for display
    getAllHours() {
        return Object.entries(this.HOURS).map(([key, value]) => ({
            key,
            ...value
        }));
    }
};

// Season-specific prayers
const SeasonalPrayers = {
    ADVENT: {
        opening: "Come, O Lord, and do not delay. Forgive the sins of your people.",
        collect: "Almighty God, give us grace to cast away the works of darkness, and put on the armor of light, now in the time of this mortal life in which your Son Jesus Christ came to visit us in great humility; that in the last day, when he shall come again in his glorious majesty to judge both the living and the dead, we may rise to the life immortal; through him who lives and reigns with you and the Holy Spirit, one God, now and for ever. Amen.",
        canticle: "O come, O come, Emmanuel,\nand ransom captive Israel,\nthat mourns in lonely exile here,\nuntil the Son of God appear.\nRejoice! Rejoice! Emmanuel\nshall come to thee, O Israel."
    },
    CHRISTMAS: {
        opening: "The Word was made flesh, alleluia. And dwelt among us, alleluia.",
        collect: "O God, you have caused this holy night to shine with the brightness of the true Light: Grant that we, who have known the mystery of that Light on earth, may also enjoy him perfectly in heaven; where with you and the Holy Spirit he lives and reigns, one God, in glory everlasting. Amen.",
        canticle: "Glory to God in the highest,\nand on earth peace, good will toward men.\nWe praise you, we bless you,\nwe worship you, we glorify you,\nwe give thanks to you for your great glory."
    },
    LENT: {
        opening: "Create in me a clean heart, O God, and renew a right spirit within me.",
        collect: "Almighty and everlasting God, you hate nothing you have made and forgive the sins of all who are penitent: Create and make in us new and contrite hearts, that we, worthily lamenting our sins and acknowledging our wretchedness, may obtain of you, the God of all mercy, perfect remission and forgiveness; through Jesus Christ our Lord, who lives and reigns with you and the Holy Spirit, one God, for ever and ever. Amen.",
        canticle: "Have mercy on me, O God,\naccording to your steadfast love;\naccording to your abundant mercy\nblot out my transgressions.\nWash me thoroughly from my iniquity,\nand cleanse me from my sin."
    },
    HOLY_WEEK: {
        opening: "Christ became obedient for us unto death, even death on a cross.",
        collect: "Almighty God, we pray you graciously to behold this your family, for whom our Lord Jesus Christ was willing to be betrayed, and given into the hands of sinners, and to suffer death upon the cross; who now lives and reigns with you and the Holy Spirit, one God, for ever and ever. Amen.",
        canticle: "Surely he has borne our griefs\nand carried our sorrows;\nyet we esteemed him stricken,\nsmitten by God, and afflicted.\nBut he was wounded for our transgressions,\nhe was bruised for our iniquities."
    },
    EASTER: {
        opening: "The Lord is risen indeed, alleluia! To him be glory and dominion for ever and ever, alleluia!",
        collect: "O God, who for our redemption gave your only-begotten Son to the death of the cross, and by his glorious resurrection delivered us from the power of our enemy: Grant us so to die daily to sin, that we may evermore live with him in the joy of his resurrection; through Jesus Christ your Son our Lord, who lives and reigns with you and the Holy Spirit, one God, now and for ever. Amen.",
        canticle: "Christ our Passover has been sacrificed for us;\ntherefore let us keep the feast,\nNot with old leaven, the leaven of malice and evil,\nbut with the unleavened bread of sincerity and truth. Alleluia!"
    },
    ORDINARY: {
        opening: "O Lord, open my lips, and my mouth shall proclaim your praise.",
        collect: "O God, the strength of all who put their trust in you: Mercifully accept our prayers; and because in our weakness we can do nothing good without you, give us the help of your grace, that in keeping your commandments we may please you both in will and deed; through Jesus Christ our Lord. Amen.",
        canticle: "Blessed be the Lord, the God of Israel;\nhe has come to his people and set them free.\nHe has raised up for us a mighty savior,\nborn of the house of his servant David."
    }
};

// Hour-specific prayers
const HourPrayers = {
    VIGILS: {
        invitatory: "Lord, open my lips.\nAnd my mouth will proclaim your praise.",
        hymn: "Father, we praise you, now the night is over,\nActive and watchful, stand we all before you;\nSinging, we offer prayer and meditation:\nThus we adore you.",
        psalm: "Psalm 95 (Venite)\n\nCome, let us sing to the Lord;\nlet us shout for joy to the Rock of our salvation.\nLet us come before his presence with thanksgiving\nand raise a loud shout to him with psalms.",
        closing: "The night has passed, and the day lies open before us; let us pray with one heart and mind."
    },
    LAUDS: {
        invitatory: "O God, come to my assistance.\nO Lord, make haste to help me.",
        hymn: "Now that the daylight fills the sky,\nWe lift our hearts to God on high,\nThat he, in all we do or say,\nWould keep us free from harm today.",
        psalm: "Psalm 63 (Deus, Deus meus)\n\nO God, you are my God; eagerly I seek you;\nmy soul thirsts for you, my flesh faints for you,\nas in a barren and dry land where there is no water.\nTherefore I have gazed upon you in your holy place,\nthat I might behold your power and your glory.",
        canticle: "Benedictus (Song of Zechariah)\n\nBlessed be the Lord, the God of Israel;\nhe has come to his people and set them free.\nHe has raised up for us a mighty savior,\nborn of the house of his servant David.",
        closing: "May the Lord bless us, protect us from all evil, and bring us to everlasting life. Amen."
    },
    TERCE: {
        invitatory: "O God, come to my assistance.\nO Lord, make haste to help me.",
        hymn: "Come, Holy Ghost, who ever One\nArt with the Father and the Son;\nCome, Holy Ghost, our souls possess\nWith your full flood of holiness.",
        psalm: "Psalm 119:33-40\n\nTeach me, O Lord, the way of your statutes,\nand I shall keep it to the end.\nGive me understanding, and I shall keep your law;\nI shall keep it with all my heart.",
        closing: "May the God of hope fill us with all joy and peace in believing. Amen."
    },
    SEXT: {
        invitatory: "O God, come to my assistance.\nO Lord, make haste to help me.",
        hymn: "O God of truth, O Lord of might,\nWho orderest time and change aright,\nWho send'st the early morning ray,\nAnd light'st the glow of perfect day.",
        psalm: "Psalm 119:105-112\n\nYour word is a lantern to my feet\nand a light upon my path.\nI have sworn and am determined\nto keep your righteous judgments.",
        closing: "Blessed be God, who has not rejected my prayer, nor withheld his love from me. Amen."
    },
    NONE: {
        invitatory: "O God, come to my assistance.\nO Lord, make haste to help me.",
        hymn: "O God, creation's secret force,\nYourself unmoved, all motion's source,\nWho from the morn till evening ray\nThrough all its changes guide the day.",
        psalm: "Psalm 121\n\nI lift up my eyes to the hills;\nfrom where is my help to come?\nMy help comes from the Lord,\nthe maker of heaven and earth.",
        closing: "Look upon your servants, Lord, and upon your works, and guide your children. Amen."
    },
    VESPERS: {
        invitatory: "O God, come to my assistance.\nO Lord, make haste to help me.",
        hymn: "O radiant Light, O Sun divine\nOf God the Father's deathless face,\nO Image of the light sublime\nThat fills the heavenly dwelling place.",
        psalm: "Psalm 141\n\nLord, I call upon you; hasten to me;\ngive ear to my voice when I call to you.\nLet my prayer be set forth in your sight as incense,\nthe lifting up of my hands as the evening sacrifice.",
        canticle: "Magnificat (Song of Mary)\n\nMy soul magnifies the Lord,\nand my spirit rejoices in God my Savior,\nfor he has looked with favor on the lowliness of his servant.\nSurely, from now on all generations will call me blessed.",
        closing: "The Lord Almighty grant us a peaceful night and a perfect end. Amen."
    },
    COMPLINE: {
        invitatory: "The Lord Almighty grant us a peaceful night and a perfect end. Amen.",
        confession: "I confess to almighty God,\nand to you, my brothers and sisters,\nthat I have sinned through my own fault,\nin my thoughts and in my words,\nin what I have done and what I have failed to do.",
        hymn: "Before the ending of the day,\nCreator of the world, we pray,\nThat with your wonted favor, you\nWould be our guard and keeper true.",
        psalm: "Psalm 91\n\nHe who dwells in the shelter of the Most High,\nabides under the shadow of the Almighty.\nHe shall say to the Lord, \"You are my refuge and my stronghold,\nmy God in whom I put my trust.\"",
        canticle: "Nunc Dimittis (Song of Simeon)\n\nLord, you now have set your servant free\nto go in peace as you have promised;\nFor these eyes of mine have seen the Savior,\nwhom you have prepared for all the world to see.",
        antiphon: "Guide us waking, O Lord, and guard us sleeping; that awake we may watch with Christ, and asleep we may rest in peace.",
        closing: "May the all-powerful Lord grant us a restful night and a peaceful death. Amen."
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiturgicalCalendar, DailyOffice, SeasonalPrayers, HourPrayers };
}
