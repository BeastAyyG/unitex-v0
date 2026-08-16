export interface LevelData {
    level: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
    nextLevelDelta: number;
}

export function calculateUserLevel(xp: number): LevelData {
    let level = 1;
    let requiredXp = 0;
    let nextLevelXp = 0;
    
    // Safety check for negative XP
    const actualXp = Math.max(0, xp);

    for (;;) {
        let step = 0;
        
        if (level <= 5) step = 500;
        else if (level <= 7) step = 750;
        else if (level <= 10) step = 1000;
        else if (level <= 15) step = 1500;
        else if (level <= 40) step = 2000;
        else step = 5000;
        
        nextLevelXp = requiredXp + step;
        
        if (actualXp >= nextLevelXp) {
            requiredXp = nextLevelXp;
            level++;
        } else {
            break;
        }
    }

    const currentLevelProgress = actualXp - requiredXp;
    const nextLevelDelta = nextLevelXp - requiredXp;
    const progress = (currentLevelProgress / nextLevelDelta) * 100;

    return {
        level,
        currentXp: actualXp,
        nextLevelXp,
        nextLevelDelta,
        progress: Math.min(100, Math.max(0, progress))
    };
}
