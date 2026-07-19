import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

const aboutStartingContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae et leo duis ut. Diam maecenas sed enim ut sem viverra aliquet eget sit. Eu non diam phasellus vestibulum lorem sed risus ultricies tristique.";
const contactStartingContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat scelerisque. Eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat scelerisque.";
const bingeBudgetStartingContent = 'Feeling bored? Find out how many episodes of your favorite television show you have time to watch tonight. Enter the show and the amount of time you have available.';

const errors = {};
const API_URL = "https://api.tvmaze.com";
let bbWatchMins = 0;
let bbShow = {};

function buildWatchPlan(episodes, availableMinutes) {
  const selectedEpisodes = [];
  let totalMinutes = 0;

  for (const episode of episodes) {
    const runtime = episode.runtime;

    if (!runtime) {
      continue;
    }

    if (totalMinutes + runtime > availableMinutes) {
      break;
    }

    selectedEpisodes.push(episode);
    totalMinutes += runtime;
  }

  return {
    episodes: selectedEpisodes,
    totalMinutes,
    remainingMinutes: availableMinutes - totalMinutes,
  };
}

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render('index.ejs', {
    bbIntro: bingeBudgetStartingContent,
    formData: {
      show: '',
      minutes: '',
    },
    errors,
  });
});

app.get("/about", (req, res) => {
  res.render("about.ejs", {
    intro: aboutStartingContent,
  })
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs", {
    intro: contactStartingContent,
  })
});

app.post('/bbSearch', async (req, res) => {
  const showInput = req.body.bbShowName?.trim() ?? '';
  const minutesInput = req.body.bbWatchMins?.trim() ?? '';
  bbWatchMins = Number(minutesInput);

  // console.log(showInput);
  if (!showInput) {
    errors.show = 'Please enter the name of a television show.';
  } else {
    delete errors.show;
  }

  if (minutesInput === '' || !Number.isFinite(bbWatchMins) || bbWatchMins < 1) {
    errors.minutes =
      'Please enter at least 1 minute of available viewing time.';
  } else {
    delete errors.minutes;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render('index.ejs', {
      bbIntro: bingeBudgetStartingContent,
      errors,
      formData: {
        show: showInput,
        minutes: minutesInput,
      },
    });
  }

  try {
    const results = await axios.get(API_URL + '/search/shows', {
      params: {
        q: showInput,
      },
    });

    if (results.data.length === 0) {
      return res.status(404).render("index.ejs", {
        bbIntro: bingeBudgetStartingContent,
        errors: {
          show: `We couldn't find a show matching "${showInput}".`,
        },
        formData: {
          show: showInput,
          minutes: minutesInput,
        },
      });
    } else if (results.data.length > 1) {
      // console.log(results.data);
      // console.log(results.data[0].show.image);
      const showOptions = [];
      for (var i = 0; i < results.data.length; i++) {
        showOptions.push(results.data[i].show);
      }
      return res.status(200).render("index.ejs", {
        bbIntro: bingeBudgetStartingContent,
        errors: {
          show: `We found multiple shows matching "${showInput}". Select one.`,
        },
        formData: {
          show: showInput,
          minutes: minutesInput,
        },
        bbShowOpts: showOptions,
      });
    } else {
      // console.log(results.data[0].show);
      res.redirect(`/bbResults/${results.data[0].show.id}`);
    }
  } catch (error) {
    console.error("TVmaze request failed:", error.message);

    res.status(500).render("index.ejs", {
      bbIntro: bingeBudgetStartingContent,
      errors: {
        general:
          "The television service is temporarily unavailable. Please try again.",
      },
      formData: {
        show: showInput,
        minutes: minutesInput,
      },
    });
  }
});

app.get("/bbResults/:showId", async (req, res) => {
  // console.log(req.params.showId);
  // console.log(bbWatchMins);

  try {
    const showResults = await axios.get(API_URL + '/shows/' + req.params.showId);
    // console.log (showResults.data);

    const episodeResults = await axios.get(API_URL + '/shows/' + req.params.showId + '/episodes');
    // console.log (episodeResults.data[0]);

    if (episodeResults.data.length === 0) {
      return res.status(404).render('results.ejs', {
        errors: {
          episode: `We couldn't find any episode data for "${showResults.data.name}".`,
        },
      });
    }

    const watchPlan = buildWatchPlan(episodeResults.data, bbWatchMins);
    // console.log(watchPlan);

    if (watchPlan.episodes.length === 0) {
      return res.status(404).render('results.ejs', {
        errors: {
          episode: `We found episode information for "${showResults.data.name}", but runtime information was either unavailable or exceeded the number of available minutes.`,
        },
      });
    }

    res.render('results.ejs', {
      watchMins: bbWatchMins,
      show: showResults.data,
      // episodes: episodeResults.data,
      watchPlan
    });
  } catch (error) {
    console.error("Compiling results failed: ", error.message);

    res.status(404).render('index.ejs', {
      bbIntro: bingeBudgetStartingContent,
      errors: {
        general:
          'Error in compiling results. See administrator.'
      },
      formData: {
        show: showInput,
        minutes: minutesInput,
      },
    });
  }
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
