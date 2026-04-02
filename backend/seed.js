require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mkPoster = (title, bg = '111111', fg = 'ffffff') =>
    `https://dummyimage.com/400x600/${bg}/${fg}.png&text=${encodeURIComponent(title)}`;

async function seed() {
    try {
        if (!process.env.MONGO_URI || typeof process.env.MONGO_URI !== 'string' || !process.env.MONGO_URI.trim()) {
            throw new Error('MONGO_URI missing in .env');
        }

        await mongoose.connect(process.env.MONGO_URI.trim());
        console.log('✅ Connected to MongoDB');

        const User = require('./models/User');
        const Movie = require('./models/Movie');
        const Event = require('./models/Event');

        await User.deleteMany({});
        await Movie.deleteMany({});
        await Event.deleteMany({});

        // Users
        const hash = async (p) => await bcrypt.hash(p, 10);

        await User.insertMany([
            {
                name: 'Demo User',
                email: 'demo@BookMyShow.in',
                password: await hash('demo123'),
                phone: '9999999999',
                city: 'Mumbai',
                loyaltyPoints: 250
            },
            {
                name: 'Admin',
                email: 'admin@BookMyShow.in',
                password: await hash('admin123'),
                role: 'admin',
                city: 'Mumbai'
            }
        ]);

        // 30 Movies
        const movies = [
            {
                title: 'Dhurandhar The Revenge',
                poster: 'https://image.tmdb.org/t/p/original/2TcpBqAjTPGAEqZqoH8dtEYoE0u.jpg',
                emoji: '🔥',
                bg: '#1a0500',
                accent: '#ff4500',
                rating: 9.5,
                votes: '223K',
                genre: ['Action', 'Thriller', 'Spy'],
                lang: ['Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada'],
                duration: '3h 49m',
                releaseDate: '19 Mar, 2026',
                certificate: 'A',
                description: 'Jaskirat Singh Rangi becomes Hamza Ali Mazari to operate deep inside Pakistan. An espionage thriller blurring patriotism and revenge.',
                cast: [
                    { name: 'Ranbir Kapoor', role: 'Jaskirat / Hamza', emoji: '🎭', color: '#2d1b00' },
                    { name: 'Yami Gautam', role: 'Officer Priya', emoji: '🎭', color: '#001b2d' },
                    { name: 'Sanjay Dutt', role: 'General Mazari', emoji: '🎭', color: '#1b002d' },
                    { name: 'Pankaj Tripathi', role: 'RAW Chief', emoji: '🎭', color: '#2d2000' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY CINEMA 2D', '4DX'],
                price: { economy: 180, regular: 250, premium: 350, recliner: 500 },
                trending: true,
                recommended: true,
                popular: true,
                nowShowing: true,
                tags: ['Blockbuster', 'Must Watch'],
                boxOffice: { opening: '₹87.5 Cr', weekend: '₹246 Cr', total: '₹512 Cr', budget: '₹350 Cr' }
            },
            {
                title: 'Kalki 2898 Returns',
                poster: 'https://m.media-amazon.com/images/M/MV5BNDhjNThiMjQtNTc0ZS00MjAxLTgyODItNDFkZjI5YjU0MDJhXkEyXkFqcGc@._V1_FMjpg_UY1973_.jpg',
                emoji: '⚡',
                bg: '#000d2d',
                accent: '#4a9eff',
                rating: 8.9,
                votes: '189K',
                genre: ['Sci-Fi', 'Action', 'Mythology'],
                lang: ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'],
                duration: '3h 10m',
                releaseDate: '02 Apr, 2026',
                certificate: 'U/A',
                description: 'In a dystopian future where gods walk among men, Kalki returns for his final mission. The epic pan-India saga continues.',
                cast: [
                    { name: 'Prabhas', role: 'Kalki', emoji: '⚡', color: '#001b40' },
                    { name: 'Deepika Padukone', role: 'Sumathi', emoji: '🎭', color: '#002d1b' },
                    { name: 'Amitabh Bachchan', role: 'Ashwatthama', emoji: '🧙', color: '#1a0d00' }
                ],
                formats: ['2D', 'IMAX 2D', '4DX', 'DOLBY'],
                price: { economy: 200, regular: 300, premium: 450, recliner: 600 },
                trending: true,
                recommended: true,
                popular: true,
                nowShowing: true,
                tags: ['Pan India', 'IMAX'],
                boxOffice: { opening: '₹95 Cr', weekend: '₹280 Cr', total: '₹420 Cr', budget: '₹600 Cr' }
            },
            {
                title: 'Pushpa 3: The Rule',
                poster: 'https://image.tmdb.org/t/p/original/t5ePZYRibJ0EEK1FK3GhihVkDW5.jpg',
                emoji: '🌿',
                bg: '#0d2d00',
                accent: '#22c55e',
                rating: 9.1,
                votes: '312K',
                genre: ['Action', 'Crime', 'Drama'],
                lang: ['Telugu', 'Hindi', 'Tamil'],
                duration: '3h 30m',
                releaseDate: '25 Apr, 2026',
                certificate: 'A',
                description: 'Pushpa Raj faces the biggest threat to his red sandalwood empire from within. The most explosive chapter yet.',
                cast: [
                    { name: 'Allu Arjun', role: 'Pushpa Raj', emoji: '🌿', color: '#0d2d00' },
                    { name: 'Rashmika Mandanna', role: 'Srivalli', emoji: '🎭', color: '#2d0d00' },
                    { name: 'Fahadh Faasil', role: 'SP Bhanwar', emoji: '👮', color: '#00102d' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 180, regular: 280, premium: 380, recliner: 500 },
                trending: true,
                popular: true,
                nowShowing: true,
                tags: ['Record Breaking', 'Pan India'],
                boxOffice: { opening: '₹120 Cr', weekend: '₹340 Cr', total: '₹680 Cr', budget: '₹400 Cr' }
            },
            {
                title: 'War 3',
                poster: 'https://image.tmdb.org/t/p/original/yUtaHkL2SDIAZhRApZAyQrAXygn.jpg',
                emoji: '💥',
                bg: '#2d1500',
                accent: '#f59e0b',
                rating: 8.4,
                votes: '145K',
                genre: ['Action', 'Spy', 'Thriller'],
                lang: ['Hindi', 'English'],
                duration: '2h 50m',
                releaseDate: '15 May, 2026',
                certificate: 'U/A',
                description: "India's deadliest agents Kabir and Khalid face an unprecedented threat. Nobody is who they seem.",
                cast: [
                    { name: 'Hrithik Roshan', role: 'Kabir', emoji: '💥', color: '#2d1500' },
                    { name: 'Jr. NTR', role: 'Khalid', emoji: '🎭', color: '#001a2d' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 160, regular: 220, premium: 300, recliner: 450 },
                popular: true,
                nowShowing: true,
                recommended: true,
                tags: ['Action Packed']
            },
            {
                title: 'Stree 3',
                poster: 'https://image.tmdb.org/t/p/original/uRCb1gfrwhzBf6DAxa9l4dL0vd9.jpg',
                emoji: '👻',
                bg: '#1a002d',
                accent: '#a855f7',
                rating: 8.7,
                votes: '201K',
                genre: ['Horror', 'Comedy', 'Mystery'],
                lang: ['Hindi'],
                duration: '2h 15m',
                releaseDate: '29 Aug, 2026',
                certificate: 'U/A',
                description: 'Stree returns to Chanderi with a secret that changes everything. The horror-comedy franchise continues.',
                cast: [
                    { name: 'Rajkummar Rao', role: 'Vicky', emoji: '😰', color: '#1a002d' },
                    { name: 'Shraddha Kapoor', role: 'Stree', emoji: '👻', color: '#2d0d00' },
                    { name: 'Aparshakti Khurana', role: 'Bittu', emoji: '😱', color: '#002d00' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 150, regular: 200, premium: 280, recliner: 400 },
                recommended: true,
                upcoming: true,
                popular: true,
                tags: ['Horror Comedy']
            },
            {
                title: 'RRR 2',
                poster: 'https://image.tmdb.org/t/p/original/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg',
                emoji: '🦁',
                bg: '#2d0000',
                accent: '#ef4444',
                rating: 9.3,
                votes: '178K',
                genre: ['Action', 'Drama', 'Historical'],
                lang: ['Telugu', 'Hindi', 'Tamil', 'Malayalam'],
                duration: '3h 20m',
                releaseDate: 'Independence Day 2026',
                certificate: 'U/A',
                description: 'Ram and Bheem return. Their bond, their fire — this time the whole world watches.',
                cast: [
                    { name: 'Ram Charan', role: 'Ram', emoji: '🔥', color: '#2d0000' },
                    { name: 'Jr. NTR', role: 'Bheem', emoji: '🦁', color: '#002d0d' },
                    { name: 'S.S. Rajamouli', role: 'Director', emoji: '🎬', color: '#0d0d0d' }
                ],
                formats: ['2D', 'IMAX 2D', '4DX', 'DOLBY'],
                price: { economy: 200, regular: 350, premium: 500, recliner: 700 },
                recommended: true,
                upcoming: true,
                tags: ['Mega Budget', 'Pan India']
            },
            {
                title: 'Animal Park',
                poster: 'https://image.tmdb.org/t/p/original/aB1Oo6zfbumB9hr5Kmw1zUrOUV7.jpg',
                emoji: '🐯',
                bg: '#1a1000',
                accent: '#d97706',
                rating: 8.6,
                votes: '99K',
                genre: ['Action', 'Crime', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 58m',
                releaseDate: '12 Jun, 2026',
                certificate: 'A',
                description: "Ranvijay Singh's legacy continues as his son inherits the empire and the ruthlessness.",
                cast: [
                    { name: 'Ranbir Kapoor', role: 'Ranvijay Jr.', emoji: '🐯', color: '#2d1500' },
                    { name: 'Tripti Dimri', role: 'Geetanjali', emoji: '🎭', color: '#1a002d' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 240, premium: 320, recliner: 450 },
                upcoming: true,
                tags: ['Sequel', 'Dark']
            },
            {
                title: 'Jawan 2',
                poster: 'https://image.tmdb.org/t/p/original/8j8VgFiziyrDmMv90H5VWBjQNTY.jpg',
                emoji: '🪖',
                bg: '#002d1a',
                accent: '#10b981',
                rating: 8.8,
                votes: '167K',
                genre: ['Action', 'Thriller', 'Social'],
                lang: ['Hindi', 'Tamil'],
                duration: '3h 05m',
                releaseDate: 'Diwali 2026',
                certificate: 'U/A',
                description: 'The Jawan returns with a new mission — the same burning passion for justice.',
                cast: [
                    { name: 'Shah Rukh Khan', role: 'Azad', emoji: '🪖', color: '#001a0d' },
                    { name: 'Nayanthara', role: 'Narmada', emoji: '🎭', color: '#1a0d00' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 180, regular: 300, premium: 420, recliner: 600 },
                upcoming: true,
                tags: ['Diwali Release', 'SRK']
            },
            {
                title: 'Amaran',
                poster: 'https://image.tmdb.org/t/p/original/yj9DbvPWjytH2EvDpGuJwos69rn.jpg',
                emoji: '🏅',
                bg: '#0d1a00',
                accent: '#84cc16',
                rating: 9.0,
                votes: '245K',
                genre: ['War', 'Drama', 'Biographical'],
                lang: ['Tamil', 'Telugu', 'Hindi', 'Malayalam'],
                duration: '2h 59m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'True story of Major Mukund Varadarajan — the most decorated officer of his generation. A masterpiece.',
                cast: [
                    { name: 'Sivakarthikeyan', role: 'Major Mukund', emoji: '🏅', color: '#0d1a00' },
                    { name: 'Sai Pallavi', role: 'Indhu Rebecca', emoji: '🎭', color: '#1a0d00' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 150, regular: 220, premium: 300, recliner: 420 },
                nowShowing: true,
                recommended: true,
                popular: true,
                trending: true,
                tags: ['Biographical', 'Must Watch'],
                boxOffice: { opening: '₹50 Cr', weekend: '₹148 Cr', total: '₹512 Cr', budget: '₹90 Cr' }
            },
            {
                title: 'Chhava',
                poster: 'https://image.tmdb.org/t/p/original/6sQzGwxf3FoJMgmUdBTEjHsctJJ.jpg',
                emoji: '🏹',
                bg: '#2d1000',
                accent: '#fb923c',
                rating: 8.6,
                votes: '167K',
                genre: ['Historical', 'Action', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 42m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Vicky Kaushal brings Chhatrapati Sambhaji Maharaj to life — the warrior who never bowed.',
                cast: [
                    { name: 'Vicky Kaushal', role: 'Sambhaji Maharaj', emoji: '🏹', color: '#2d1000' },
                    { name: 'Rashmika Mandanna', role: 'Yesubai', emoji: '🎭', color: '#1a0010' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 230, premium: 320, recliner: 450 },
                nowShowing: true,
                recommended: true,
                trending: true,
                popular: true,
                tags: ['Historical', 'Patriotic'],
                boxOffice: { opening: '₹31 Cr', weekend: '₹92 Cr', total: '₹320 Cr', budget: '₹120 Cr' }
            },
            {
                title: 'Sky Force',
                poster: 'https://image.tmdb.org/t/p/original/unUxGrWQIMFwIYd7MalLP2SY7Jl.jpg',
                emoji: '✈️',
                bg: '#001530',
                accent: '#38bdf8',
                rating: 8.3,
                votes: '112K',
                genre: ['Action', 'War', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 28m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: "India's first and deadliest airstrike — a tribute to brave IAF pilots. Based on true events.",
                cast: [
                    { name: 'Akshay Kumar', role: 'KO Ahuja', emoji: '✈️', color: '#001530' },
                    { name: 'Veer Pahariya', role: 'T. Vijaya', emoji: '🎭', color: '#002040' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 150, regular: 220, premium: 300, recliner: 400 },
                nowShowing: true,
                recommended: true,
                popular: true,
                tags: ['Patriotic', 'Based on True Events']
            },
            {
                title: 'Marco',
                poster: 'https://image.tmdb.org/t/p/original/8ev49IKXhJpiDVLFijjKL1y3Ct1.jpg',
                emoji: '🔫',
                bg: '#1a0000',
                accent: '#dc2626',
                rating: 8.8,
                votes: '156K',
                genre: ['Action', 'Crime', 'Thriller'],
                lang: ['Malayalam', 'Hindi', 'Telugu'],
                duration: '2h 37m',
                releaseDate: 'Running',
                certificate: 'A',
                description: 'Marco — the most brutal Malayalam action film. Unai Mohan takes revenge against the drug mafia.',
                cast: [
                    { name: 'Unni Mukundan', role: 'Marco', emoji: '🔫', color: '#1a0000' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 230, premium: 310, recliner: 430 },
                nowShowing: true,
                trending: true,
                popular: true,
                tags: ['Brutal Action', 'Must Watch']
            },
            {
                title: 'Sikandar',
                poster: 'https://image.tmdb.org/t/p/original/fBJAq1Xymrqj0UOXELXpJSKuNxe.jpg',
                emoji: '⚔️',
                bg: '#1a1500',
                accent: '#eab308',
                rating: 8.2,
                votes: '134K',
                genre: ['Action', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 45m',
                releaseDate: 'Eid 2026',
                certificate: 'U/A',
                description: 'Salman Khan is back — the most unstoppable action of 2026.',
                cast: [
                    { name: 'Salman Khan', role: 'Sikandar', emoji: '⚔️', color: '#1a1500' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 220, premium: 300, recliner: 450 },
                nowShowing: true,
                trending: true,
                popular: true,
                tags: ['Eid Release'],
                boxOffice: { opening: '₹42 Cr', weekend: '₹120 Cr', total: '₹280 Cr', budget: '₹200 Cr' }
            },
            {
                title: 'Lucky Baskhar',
                poster: 'https://image.tmdb.org/t/p/original/i3nbrnnZixksD0Lx0TE2ixgpZLy.jpg',
                emoji: '🍀',
                bg: '#001a10',
                accent: '#22d3ee',
                rating: 8.3,
                votes: '123K',
                genre: ['Crime', 'Thriller', 'Drama'],
                lang: ['Telugu', 'Tamil', 'Hindi'],
                duration: '2h 28m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'A middle-class bank employee entangled in money laundering. Dulquer Salmaan shines.',
                cast: [
                    { name: 'Dulquer Salmaan', role: 'Lucky Baskhar', emoji: '🍀', color: '#001a10' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 150, regular: 210, premium: 290, recliner: 400 },
                nowShowing: true,
                recommended: true,
                popular: true,
                tags: ['Crime Drama']
            },
            {
                title: 'Project Hail Mary',
                poster: 'https://image.tmdb.org/t/p/original/gK2Qp7XywbzdIFNSPavEWlqw1DA.jpg',
                emoji: '🚀',
                bg: '#0d0030',
                accent: '#8b5cf6',
                rating: 8.5,
                votes: '78K',
                genre: ['Sci-Fi', 'Adventure'],
                lang: ['English', 'Hindi'],
                duration: '2h 40m',
                releaseDate: '01 Apr, 2026',
                certificate: 'U/A',
                description: 'A lone astronaut on a mission to save Earth. Ryan Gosling stars in this adaptation of the acclaimed novel.',
                cast: [
                    { name: 'Ryan Gosling', role: 'Ryland Grace', emoji: '🚀', color: '#0d0030' }
                ],
                formats: ['2D', 'IMAX 2D'],
                price: { economy: 200, regular: 280, premium: 380, recliner: 500 },
                nowShowing: true,
                recommended: true,
                tags: ['Hollywood', 'Must Watch']
            },
            {
                title: 'The Kerala Story 2',
                poster: 'https://image.tmdb.org/t/p/original/97jAFQcAnspd416cupbAbGMNT9z.jpg',
                emoji: '🌊',
                bg: '#001a2d',
                accent: '#0ea5e9',
                rating: 7.8,
                votes: '45K',
                genre: ['Drama', 'Thriller'],
                lang: ['Malayalam', 'Hindi'],
                duration: '2h 20m',
                releaseDate: '28 Mar, 2026',
                certificate: 'A',
                description: 'The sequel continues exposing hidden truths. A powerful social drama.',
                cast: [
                    { name: 'Adah Sharma', role: 'Shalini', emoji: '🌊', color: '#001a2d' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 200, premium: 250, recliner: 350 },
                nowShowing: true,
                popular: true,
                tags: ['Social Drama']
            },
            {
                title: 'Devara Part 2',
                poster: 'https://image.tmdb.org/t/p/original/e3qMlodj9gysXNHjHBiSL7qe72u.jpg',
                emoji: '🌊',
                bg: '#0a0a1f',
                accent: '#6366f1',
                rating: 8.0,
                votes: '89K',
                genre: ['Action', 'Drama', 'Thriller'],
                lang: ['Telugu', 'Hindi', 'Tamil'],
                duration: '3h 00m',
                releaseDate: '05 Apr, 2026',
                certificate: 'A',
                description: 'The fearless Devara continues his ocean kingdom battle.',
                cast: [
                    { name: 'Jr. NTR', role: 'Devara', emoji: '🌊', color: '#0a0a1f' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 180, regular: 260, premium: 360, recliner: 500 },
                nowShowing: true,
                popular: true,
                tags: ['Pan India']
            },
            {
                title: 'Emergency',
                poster: 'https://image.tmdb.org/t/p/original/or94yBr8bwDPYYY3n8OIu0Q32S3.jpg',
                emoji: '⚡',
                bg: '#1a1000',
                accent: '#ca8a04',
                rating: 7.9,
                votes: '78K',
                genre: ['Political', 'Historical', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 26m',
                releaseDate: 'Running',
                certificate: 'UA 16+',
                description: 'Kangana Ranaut plays Indira Gandhi in the most controversial political drama of the decade.',
                cast: [
                    { name: 'Kangana Ranaut', role: 'Indira Gandhi', emoji: '⚡', color: '#1a1000' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 200, premium: 260, recliner: 360 },
                nowShowing: true,
                tags: ['Political Drama']
            },
            {
                title: 'Mufasa: The Lion King',
                poster: 'https://image.tmdb.org/t/p/original/9bXHaLlsFYpJUutg4E6WXAjaxDi.jpg',
                emoji: '🦁',
                bg: '#1a0d00',
                accent: '#f97316',
                rating: 7.5,
                votes: '67K',
                genre: ['Animation', 'Drama', 'Adventure'],
                lang: ['English', 'Hindi', 'Tamil', 'Telugu'],
                duration: '1h 58m',
                releaseDate: 'Running',
                certificate: 'U',
                description: "The origin story of Mufasa — how a lost cub became king of the Pride Lands.",
                cast: [
                    { name: 'Aaron Pierre', role: 'Young Mufasa', emoji: '🦁', color: '#1a0d00' }
                ],
                formats: ['2D', 'IMAX 2D', '4DX'],
                price: { economy: 150, regular: 200, premium: 280, recliner: 400 },
                nowShowing: true,
                popular: true,
                tags: ['Disney', 'Family']
            },
            {
                title: 'Baby John',
                poster: 'https://image.tmdb.org/t/p/original/e51ipo5TfeWgHlxKaBirQCY4yu9.jpg',
                emoji: '👶',
                bg: '#001a30',
                accent: '#0284c7',
                rating: 6.5,
                votes: '45K',
                genre: ['Action', 'Drama'],
                lang: ['Hindi', 'Tamil'],
                duration: '2h 30m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Varun Dhawan on a mission to protect his daughter.',
                cast: [
                    { name: 'Varun Dhawan', role: 'Baby John', emoji: '👶', color: '#001a30' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 200, premium: 250, recliner: 360 },
                nowShowing: true,
                tags: ['Family Action']
            },
            {
                title: 'Game Changer',
                poster: 'https://image.tmdb.org/t/p/original/mrv21gwDFlD7SGayUGLLw3W6rTU.jpg',
                emoji: '🎮',
                bg: '#1a0020',
                accent: '#ec4899',
                rating: 6.8,
                votes: '189K',
                genre: ['Action', 'Drama', 'Political'],
                lang: ['Telugu', 'Hindi', 'Tamil'],
                duration: '2h 52m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Ram Charan as IAS officer Ram Nandan taking on corruption.',
                cast: [
                    { name: 'Ram Charan', role: 'Ram Nandan', emoji: '🎮', color: '#1a0020' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 150, regular: 200, premium: 270, recliner: 380 },
                nowShowing: true,
                tags: ['Political Drama']
            },
            {
                title: 'Daaku Maharaaj',
                poster: 'https://image.tmdb.org/t/p/original/rGW9ad5TERuoluGSkgF1wHXP45H.jpg',
                emoji: '🤠',
                bg: '#2d1000',
                accent: '#d97706',
                rating: 7.8,
                votes: '67K',
                genre: ['Action', 'Drama'],
                lang: ['Telugu'],
                duration: '2h 20m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Bobby Deol and Nandamuri Balakrishna in an explosive mass entertainer.',
                cast: [
                    { name: 'Nandamuri Balakrishna', role: 'Maharaaj', emoji: '🤠', color: '#2d1000' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 150, regular: 200, premium: 270, recliner: 380 },
                nowShowing: true,
                tags: ['Mass Entertainer']
            },
            {
                title: 'Vidaamuyarchi',
                poster: 'https://image.tmdb.org/t/p/original/ajSZuWyKcGksm4FDmHFryUuQmFg.jpg',
                emoji: '🌐',
                bg: '#001530',
                accent: '#7c3aed',
                rating: 7.6,
                votes: '67K',
                genre: ['Action', 'Thriller'],
                lang: ['Tamil', 'Telugu', 'Hindi'],
                duration: '2h 25m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Ajith Kumar in a high-octane international thriller.',
                cast: [
                    { name: 'Ajith Kumar', role: 'Arjun', emoji: '🌐', color: '#001530' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 220, premium: 300, recliner: 420 },
                nowShowing: true,
                popular: true,
                tags: ['International Thriller']
            },
            {
                title: 'Sitaare Zameen Par',
                poster: 'https://upload.wikimedia.org/wikipedia/hi/4/44/Sitaare_Zameen_Par_poster.jpg',
                emoji: '⭐',
                bg: '#0d1a2d',
                accent: '#3b82f6',
                rating: 8.4,
                votes: '89K',
                genre: ['Drama', 'Sports', 'Inspirational'],
                lang: ['Hindi'],
                duration: '2h 45m',
                releaseDate: 'Running',
                certificate: 'U',
                description: 'Aamir Khan coaches a basketball team of special needs children. Most heartwarming film of 2026.',
                cast: [
                    { name: 'Aamir Khan', role: 'Coach Devraj', emoji: '⭐', color: '#0d1a2d' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 230, premium: 310, recliner: 420 },
                nowShowing: true,
                recommended: true,
                popular: true,
                tags: ['Heartwarming', 'Inspirational']
            },
            {
                title: 'Kesari Chapter 2',
                poster: 'https://upload.wikimedia.org/wikipedia/hi/9/95/Kesari_Chapter_2.jpg',
                emoji: '🧡',
                bg: '#2d0d00',
                accent: '#ea580c',
                rating: 8.1,
                votes: '78K',
                genre: ['Historical', 'Action', 'War'],
                lang: ['Hindi'],
                duration: '2h 28m',
                releaseDate: '18 Apr, 2026',
                certificate: 'U/A',
                description: 'The forgotten chapter of Battle of Saragarhi — 21 soldiers vs 10,000 enemies.',
                cast: [
                    { name: 'Akshay Kumar', role: 'Havildar Ishar Singh', emoji: '🧡', color: '#2d0d00' }
                ],
                formats: ['2D', 'IMAX 2D', 'DOLBY'],
                price: { economy: 160, regular: 230, premium: 320, recliner: 450 },
                upcoming: true,
                popular: true,
                nowShowing: false,
                tags: ['Patriotic', 'Upcoming']
            },
            {
                title: 'Housefull 5',
                poster: 'https://upload.wikimedia.org/wikipedia/hi/b/bd/Housefull_4_poster.jpeg',
                emoji: '🏠',
                bg: '#1a001a',
                accent: '#c026d3',
                rating: 6.0,
                votes: '23K',
                genre: ['Comedy', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 15m',
                releaseDate: 'June 2026',
                certificate: 'U/A',
                description: 'The biggest comedy franchise returns with the most chaotic installment.',
                cast: [
                    { name: 'Akshay Kumar', role: 'Guddu', emoji: '🏠', color: '#1a001a' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 190, premium: 250, recliner: 350 },
                upcoming: true,
                nowShowing: false,
                tags: ['Comedy', 'Franchise']
            },
            {
                title: 'Maalik',
                poster: 'https://upload.wikimedia.org/wikipedia/en/5/5d/Maalik_%282025_film%29.jpg',
                emoji: '👑',
                bg: '#0d0d00',
                accent: '#ca8a04',
                rating: 7.2,
                votes: '26K',
                genre: ['Crime', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 18m',
                releaseDate: 'Upcoming',
                certificate: 'A',
                description: 'Rajkummar Rao rises to power in a dark world of crime and politics.',
                cast: [
                    { name: 'Rajkummar Rao', role: 'Maalik', emoji: '👑', color: '#0d0d00' }
                ],
                formats: ['2D', 'DOLBY'],
                price: { economy: 160, regular: 220, premium: 300, recliner: 420 },
                upcoming: true,
                nowShowing: false,
                tags: ['Crime Drama']
            },
            {
                title: 'Azaad',
                poster: 'https://image.tmdb.org/t/p/original/q6w0L7XQYk7f6P5H2J2LxQhM8YB.jpg',
                emoji: '🐎',
                bg: '#1a0800',
                accent: '#b45309',
                rating: 6.8,
                votes: '34K',
                genre: ['Historical', 'Adventure', 'Drama'],
                lang: ['Hindi'],
                duration: '2h 22m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: "Rasha Thadani and Aaman Devgan's debut in a period adventure saga.",
                cast: [
                    { name: 'Aaman Devgan', role: 'Azaad', emoji: '🐎', color: '#1a0800' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 190, premium: 250, recliner: 350 },
                nowShowing: true,
                tags: ['Debut Film']
            },
            {
                title: 'Identity',
                poster: 'https://image.tmdb.org/t/p/original/sYgimsiBywqVwJI8H4sETke8m7v.jpg',
                emoji: '🔍',
                bg: '#0a0a20',
                accent: '#818cf8',
                rating: 7.4,
                votes: '28K',
                genre: ['Thriller', 'Mystery'],
                lang: ['Malayalam'],
                duration: '2h 15m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Tovino Thomas in a psychological thriller where the investigator becomes the suspect.',
                cast: [
                    { name: 'Tovino Thomas', role: 'Arun', emoji: '🔍', color: '#0a0a20' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 200, premium: 260, recliner: 360 },
                nowShowing: true,
                tags: ['Psychological Thriller']
            },
            {
                title: 'Sankranthiki Vasthunam',
                poster: 'https://image.tmdb.org/t/p/original/iuG8wWEBFePmKtEYYXgtXaV4UVQ.jpg',
                emoji: '🎊',
                bg: '#1a1500',
                accent: '#fbbf24',
                rating: 8.0,
                votes: '89K',
                genre: ['Action', 'Comedy', 'Drama'],
                lang: ['Telugu'],
                duration: '2h 38m',
                releaseDate: 'Running',
                certificate: 'U/A',
                description: 'Venkatesh Daggubati in a festive family entertainer.',
                cast: [
                    { name: 'Venkatesh', role: 'Yadagiri', emoji: '🎊', color: '#1a1500' }
                ],
                formats: ['2D'],
                price: { economy: 150, regular: 200, premium: 270, recliner: 360 },
                nowShowing: true,
                tags: ['Family Entertainer']
            }
        ];

        await Movie.insertMany(movies);
        console.log('✅ Movies seeded');

        await Event.insertMany([
            { title: 'Arijit Singh Live', category: 'Concert', emoji: '🎤', bg: '#2d001a', description: 'Experience an unforgettable night with Arijit Singh.', venue: 'Jio World Garden', city: 'Mumbai', date: '5 Apr 2026', time: '7:00 PM', price: 1499, priceLabel: '₹1,499 onwards', featured: true },
            { title: 'Comedy Night with Zakir Khan', category: 'Comedy', emoji: '😂', bg: '#1a0d00', description: 'Hilarious evening with Zakir Khan.', venue: 'Shanmukhananda Hall', city: 'Mumbai', date: '9 Apr 2026', time: '8:00 PM', duration: '120 mins', price: 999, priceLabel: '₹999 onwards', artist: 'Zakir Khan', featured: true },
            { title: 'Sunburn Arena', category: 'Concert', emoji: '🎧', bg: '#001a2d', description: 'EDM night with international DJs.', venue: 'MMRDA Grounds', city: 'Mumbai', date: '20 Apr 2026', time: '6:00 PM', price: 1800, priceLabel: '₹1,800 onwards', featured: true },
            { title: 'Kenny Sebastian Live', category: 'Comedy', emoji: '🎙️', bg: '#001a10', description: 'Stand-up comedy special by Kenny Sebastian.', venue: 'Royal Opera House', city: 'Mumbai', date: '12 Jun 2026', time: '7:30 PM', duration: '90 mins', price: 850, priceLabel: '₹850 onwards', artist: 'Kenny Sebastian', featured: false },
            { title: 'IPL 2026 — MI vs CSK', category: 'Sports', emoji: '🏏', bg: '#001a30', description: 'The biggest rivalry in cricket!', venue: 'Wankhede Stadium', city: 'Mumbai', date: '1 Apr 2026', time: '7:30 PM', price: 800, priceLabel: '₹800 onwards', featured: true },
            { title: 'Pro Kabaddi — Mumbai vs Jaipur', category: 'Sports', emoji: '🤼', bg: '#1a0d00', description: 'High-octane kabaddi action.', venue: 'NSCI Dome', city: 'Mumbai', date: '5 Apr 2026', time: '7:00 PM', price: 250, priceLabel: '₹250 onwards', featured: false },
            { title: 'WWE Live India 2026', category: 'Sports', emoji: '🥊', bg: '#1a0000', description: 'WWE superstars live in India!', venue: 'DY Patil Stadium', city: 'Mumbai', date: '22 Apr 2026', time: '6:00 PM', price: 1200, priceLabel: '₹1,200 onwards', featured: true },
            { title: 'IPL 2026 — DC vs MI', category: 'Sports', emoji: '🏏', bg: '#001530', description: 'Delhi vs Mumbai clash!', venue: 'Arun Jaitley Stadium', city: 'Delhi-NCR', date: '8 Apr 2026', time: '7:30 PM', price: 700, priceLabel: '₹700 onwards', featured: false },
            { title: 'Mughal-E-Azam — The Musical', category: 'Theatre', emoji: '🎭', bg: '#1a1500', description: 'The legendary musical theatre production.', venue: 'NCPA, Nariman Point', city: 'Mumbai', date: 'Every Weekend', time: '7:00 PM', price: 500, priceLabel: '₹500 onwards', featured: true },
            { title: 'Cirque Du Soleil — ECHO India', category: 'Theatre', emoji: '🌊', bg: '#001a2d', description: 'International acrobatic spectacular.', venue: 'BKC Open Grounds', city: 'Mumbai', date: '15 Apr 2026', time: '6:00 PM', price: 2000, priceLabel: '₹2,000 onwards', featured: true }
        ]);

        console.log('✅ Events seeded');
        console.log('\n🎬 Database seeded successfully!');
        console.log('📧 demo@BookMyShow.in / demo123');
        console.log('🔑 admin@BookMyShow.in / admin123\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message || err);
        process.exit(1);
    }
}

seed();