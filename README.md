# Menu Planner

A collaborative family meal planning app built with Vue 3, TypeScript, and Supabase. Plan your weekly meals, build a meal library, and automatically generate shopping lists.

## Features

- 🍽️ **Meal Library** - Save your favorite meals with ingredients and servings
- 📅 **Weekly Planner** - Drag and drop meals onto a calendar
- 🛒 **Smart Shopping Lists** - Auto-generate from planned meals
- 👨‍👩‍👧‍👦 **Family Sharing** - Share your meal plan with family using a 6-character code
- ☁️ **Cloud Sync** - Automatic sync across all devices
- 📱 **No Account Required** - Uses anonymous authentication
- 💰 **Free to Use** - Runs on Supabase free tier

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd menu-planner
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in the SQL Editor
   - Enable Anonymous Authentication in Settings → Authentication → Providers
   - See [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for detailed instructions

4. **Configure environment**

   Create a `.env` file in the project root:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Get these values from your Supabase project settings.

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

### First Time Use

1. Visit the app - you're automatically signed in anonymously
2. Your personal family is created automatically
3. Start adding meals to your library
4. Plan meals on the calendar
5. Generate shopping lists from your planned meals

### Sharing with Family

1. Click the family badge in the header to see your family code
2. Share the 6-character code with family members
3. They enter the code to join your family
4. Everyone sees the same meals, planner, and shopping lists in real-time

### Managing Meals

**Add a meal:**
- Click "Add Meal" in the Meal Library
- Enter name, ingredients (one per line), and servings
- Click Save

**Plan a meal:**
- Drag a meal from the library onto a day in the planner
- Or click the "+" button on a day

**Create shopping list:**
- Plan meals for the week
- Shopping list automatically includes all ingredients

## Project Structure

```
src/
├── api/              # TanStack Query API layer
│   └── families/     # Family queries and mutations
├── components/       # Vue components
│   ├── MealLibrary/  # Meal management
│   ├── Planner/      # Calendar/planner
│   └── ShoppingList/ # Shopping list
├── composables/      # Vue composables
│   ├── queries/      # Data fetching hooks
│   └── mutations/    # Data mutation hooks
├── services/         # Core services
│   ├── supabase.ts   # Supabase client
│   └── familyService.ts
├── stores/           # Pinia stores
│   ├── auth.ts       # Authentication
│   └── shoppingList.ts
├── types/            # TypeScript types
├── utils/            # Utilities and transformers
└── App.vue           # Root component
```

## Tech Stack

- **Framework:** Vue 3 with `<script setup>` and TypeScript
- **Build Tool:** Vite
- **State Management:** Pinia + TanStack Query
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Anonymous Auth
- **Styling:** TailwindCSS + DaisyUI
- **UI Components:** Auto-imported with unplugin-vue-components

## Development

```bash
# Install dependencies
npm install

# Run dev server with hot reload
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

Vercel will automatically detect Vite and configure the build.

### Deploy to Netlify

1. Push your code to GitHub
2. Import the project in [Netlify](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Site Settings
5. Deploy

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) - Architecture and AI context
- [`IMPLEMENTATION_SUMMARY.md`](./IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) - Supabase setup guide

## Troubleshooting

**Problem:** Meals aren't syncing

- Check browser console for errors
- Verify environment variables are set correctly
- Check Supabase project is running
- Verify RLS policies are enabled

**Problem:** Can't join family with code

- Ensure code is exactly 6 characters
- Check that the family exists in Supabase
- Verify you're not already in a family (leave current family first)

**Problem:** Build fails

- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 18 or higher
- Verify `.env` file exists and has correct values

## Contributing

This is a personal project, but suggestions and bug reports are welcome! Feel free to open an issue.

## License

MIT License - feel free to use this project for your own meal planning needs.

## Support

For setup help, see the [Supabase Setup Guide](./SUPABASE_SETUP.md).

For technical details, see the [Implementation Summary](./IMPLEMENTATION_SUMMARY.md).

---

Built with ❤️ using Vue 3 + TypeScript + Supabase
