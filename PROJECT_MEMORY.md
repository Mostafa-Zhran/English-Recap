# English Leap - B1 English Learning Platform Project Overview

## Project Purpose
English Leap is a modern B1-level English learning web platform designed to help learners master English through vocabulary, videos, conversation practice, quizzes, and flashcards.

## Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Styling**: Custom CSS with CSS variables for theming
- **Fonts**: Poppins (main) and Playfair Display (display) via Google Fonts
- **Data**: JSON-based content storage
- **Features**: Text-to-Speech (Web Speech API), YouTube embeds, localStorage for theme persistence

## File Structure
```
d:\project\
├── index.html          # Home page with chapter listing
├── chapter.html        # Individual chapter detail page
├── css/
│   └── style.css       # Complete design system (1260+ lines)
├── js/
│   ├── app.js          # Home page logic (320+ lines)
│   └── chapter.js      # Chapter page logic (591 lines)
├── icons/
│   └── Endlish-Recap.png # Custom logo icon
└── data/
    ├── chapters.json   # 6 chapters with full content
    └── config.json     # Playlist URLs per level
```

## Current Content (6 Chapters)
1. Nice to See You Again - Greetings, present perfect vs past simple
2. Are You Ready for Your Guests? - Event planning, suggestions
3. Have You Ever Been There? - Travel, present perfect with ever/never
4. How is the dish prepared? - Restaurant English, passive voice
5. Enjoy your flight! - Airport vocabulary, future progressive
6. Now you can...! - Review and practice chapter

## Chapter Data Structure
Each chapter in chapters.json contains:
- id, title, level (B1/B2), icon, color, description
- summary: vocabulary array, grammar explanation
- videos: array of YouTube URLs
- conversation: array of speaker/text pairs
- quiz: array of question/options/answer objects

## Playlist Configuration
Playlist URLs are stored in a separate `data/config.json` file. Each level can have multiple playlists with custom titles:
```json
{
  "playlists": {
    "B1": [
      {
        "title": "Main Course",
        "url": "https://youtube.com/playlist?list=PLAYLIST_ID"
      },
      {
        "title": "Grammar Practice",
        "url": "https://youtube.com/playlist?list=PLAYLIST_ID"
      }
    ],
    "B2": [
      {
        "title": "Main Course",
        "url": "https://youtube.com/playlist?list=PLAYLIST_ID"
      }
    ]
  }
}
```
Playlists appear in a dedicated professional section on the home page, organized by level in a grid layout with clickable cards.

## Key Features
- **Dark Mode**: Toggle with localStorage persistence
- **Search**: Real-time search across titles, descriptions, vocabulary
- **Filter**: Filter chapters by level (All, B1, B2)
- **Playlist Section**: Dedicated professional section with playlist cards organized by level
- **Embedded Preview**: Hover over playlist cards to see mini YouTube player preview (desktop only)
- **TTS**: Text-to-speech for vocabulary and conversations
- **Quiz System**: Interactive quiz with scoring and feedback
- **Flashcards**: Flip-card vocabulary practice
- **YouTube Integration**: Auto-convert URLs to embed format
- **Responsive Design**: Mobile-friendly with sidebar navigation

## Design System
- **Primary Color**: #0A66C2 (blue)
- **Radius**: 16px default, 10px-32px range
- **Shadows**: Multi-layered blue-tinted shadows
- **Transitions**: cubic-bezier easing for smooth animations
- **Dark Mode**: CSS variables override for dark theme

## Important Code Patterns
- **Chapter Navigation**: `openChapter(id)` stores ID in localStorage and redirects
- **Tab System**: `switchTab(tabId)` handles both main tabs and sidebar sync
- **TTS**: `speakText(text)` uses Web Speech API with en-US, rate 0.92
- **YouTube Conversion**: `convertToEmbed(url)` handles youtu.be and watch?v= formats
- **Quiz State**: currentQuizIndex, quizScore, quizAnswered tracked globally
- **Toast Notifications**: `showToast(msg, type)` for user feedback
- **Playlist Rendering**: `renderPlaylistLinks()` dynamically adds playlist buttons to filter bar

## Configuration
To add YouTube playlist links for each level:
1. Open `data/config.json`
2. Each level (B1, B2) has an array of playlist objects with `title` and `url`
3. Add multiple playlists per level by adding more objects to the array:
   ```json
   "B1": [
     {"title": "Main Course", "url": "playlist_url"},
     {"title": "Grammar", "url": "playlist_url"}
   ]
   ```
4. The playlists will automatically appear in a dedicated section on the home page
5. The section is hidden if no playlists are configured
6. Links only appear if the URL doesn't contain "YOUR_" (placeholder check)
7. Hover over playlist cards on desktop to see embedded YouTube preview (disabled on mobile for performance)

## Global Functions Exposed
- openChapter(id)
- toggleTheme()
- showToast(msg, type)
- switchTab(tabId)
- speakText(text)
- speakMessage(text, btn)
- stopSpeech()
- readFullConversation()
- answerQuiz(selectedIndex)
- nextQuestion()
- renderQuiz()

## Current Stats
- 6 chapters total
- 72+ vocabulary words
- 12 videos
- 18 quiz questions
- All chapters are B1 level (UI supports B2 filter but no B2 content yet)

## Known Issues
- README.md file has null bytes and cannot be read
- No B2 level content yet despite filter UI

## Future Enhancement Opportunities
- Add B2 level chapters
- Add pronunciation audio files (currently using TTS)
- Add progress tracking
- Add spaced repetition for flashcards
- Add more interactive exercises
