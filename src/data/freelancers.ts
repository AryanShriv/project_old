import { Freelancer } from "../types/freelancer";

export const freelancers: Freelancer[] = [
    {
        id: "1",
        name: "John Carter",
        title: "Senior Product Designer",
        yearsExperience: "8 years",
        experience: [
            {
                id: "e1",
                year: "2023",
                role: "Staff Product Designer",
                company: "Stripe",
                description: "Led design systems for payments platform",
            },
            {
                id: "e2",
                year: "2020",
                role: "Senior Product Designer",
                company: "Shopify",
                description: "Built merchant onboarding experience",
            },
            {
                id: "e3",
                year: "2017",
                role: "Product Designer",
                company: "Fintech Startup",
                description: "Designed mobile banking experience",
            },
        ],
        tagline: "I design scalable digital products and design systems.",
        rate: "$65",
        avatar: "https://i.pravatar.cc/200?img=7",
        skills: ["Figma", "UX", "Design Systems"],
        portfolio: [
            {
                id: "p1",
                title: "Fintech Mobile App",
                description: "Mobile banking experience redesign",
                image: "https://picsum.photos/400/300",
            },
            {
                id: "p2",
                title: "SaaS Dashboard",
                description: "Analytics dashboard for B2B platform",
                image: "https://picsum.photos/400/301",
            },
        ],
    },

    {
        id: "2",
        name: "Sarah Lee",
        title: "Frontend Engineer",
        yearsExperience: "6 years",
        experience: [
            {
                id: "e4",
                year: "2023",
                role: "Senior Frontend Engineer",
                company: "Vercel",
                description: "Built performance optimized React applications",
            },
            {
                id: "e5",
                year: "2021",
                role: "Frontend Engineer",
                company: "Airbnb",
                description: "Worked on design system and booking UI",
            },
        ],
        tagline: "Crafting fast and accessible frontend experiences.",
        rate: "$80",
        avatar: "https://i.pravatar.cc/200?img=5",
        skills: ["React", "Next.js", "TypeScript"],
        portfolio: [
            {
                id: "p3",
                title: "Travel Booking Platform",
                description: "Modern UI for booking experiences",
                image: "https://picsum.photos/400/302",
            },
            {
                id: "p4",
                title: "E-commerce Frontend",
                description: "High performance storefront UI",
                image: "https://picsum.photos/400/303",
            },
        ],
    },

    {
        id: "3",
        name: "Daniel Kim",
        title: "Backend Engineer",
        yearsExperience: "7 years",
        experience: [
            {
                id: "e6",
                year: "2024",
                role: "Senior Backend Engineer",
                company: "AWS",
                description: "Designed scalable microservices infrastructure",
            },
            {
                id: "e7",
                year: "2020",
                role: "Backend Engineer",
                company: "Uber",
                description: "Built real-time trip data services",
            },
        ],
        tagline: "Building scalable distributed systems.",
        rate: "$95",
        avatar: "https://i.pravatar.cc/200?img=11",
        skills: ["Node.js", "GraphQL", "AWS"],
        portfolio: [
            {
                id: "p5",
                title: "Ride Sharing Backend",
                description: "Real-time ride tracking service",
                image: "https://picsum.photos/400/304",
            },
            {
                id: "p6",
                title: "Payment Processing API",
                description: "Secure payment microservices",
                image: "https://picsum.photos/400/305",
            },
        ],
    },

    {
        id: "4",
        name: "Aisha Khan",
        title: "Mobile App Developer",
        yearsExperience: "5 years",
        experience: [
            {
                id: "e8",
                year: "2023",
                role: "Senior Mobile Engineer",
                company: "Spotify",
                description: "Developed cross-platform music streaming features",
            },
            {
                id: "e9",
                year: "2021",
                role: "React Native Developer",
                company: "Startup Studio",
                description: "Built multiple startup MVPs",
            },
        ],
        tagline: "Building smooth cross-platform mobile apps.",
        rate: "$75",
        avatar: "https://i.pravatar.cc/200?img=20",
        skills: ["React Native", "Expo", "TypeScript"],
        portfolio: [
            {
                id: "p7",
                title: "Music Streaming App",
                description: "Mobile music discovery experience",
                image: "https://picsum.photos/400/306",
            },
            {
                id: "p8",
                title: "Fitness Tracker",
                description: "Workout tracking mobile app",
                image: "https://picsum.photos/400/307",
            },
        ],
    },

    {
        id: "5",
        name: "Marco Alvarez",
        title: "Growth Product Manager",
        yearsExperience: "9 years",
        experience: [
            {
                id: "e10",
                year: "2023",
                role: "Lead Product Manager",
                company: "Notion",
                description: "Led growth experiments across onboarding funnel",
            },
            {
                id: "e11",
                year: "2019",
                role: "Product Manager",
                company: "Dropbox",
                description: "Improved user activation and retention",
            },
        ],
        tagline: "Helping products grow through experimentation.",
        rate: "$110",
        avatar: "https://i.pravatar.cc/200?img=15",
        skills: ["Product Strategy", "Growth", "Analytics"],
        portfolio: [
            {
                id: "p9",
                title: "User Activation System",
                description: "Improved onboarding conversion by 35%",
                image: "https://picsum.photos/400/308",
            },
            {
                id: "p10",
                title: "Growth Experiment Framework",
                description: "A/B testing platform for startups",
                image: "https://picsum.photos/400/309",
            },
        ],
    },
];