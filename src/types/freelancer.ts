export type Freelancer = {
    id: string;
    name: string;
    title: string;
    yearsExperience: string;
    tagline: string;
    rate: string;
    avatar: string;
    skills: string[];

    experience: {
        id: string;
        year: string;
        role: string;
        company: string;
        description: string;
    }[];

    portfolio: {
        id: string;
        title: string;
        description: string;
        image: string;
    }[];
};