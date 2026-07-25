import { ads } from "$lib/ads";

export function pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Cannot pick from an empty array');
    return arr[Math.floor(Math.random() * arr.length)];
}

const recentlyPlayed: number[] = []

export function getRandomAd(): string {
    if (ads.length === 0) throw new Error('Cannot pick from an empty array');
    let index = Math.floor(Math.random() * ads.length);
    while (recentlyPlayed.includes(index)) {
        index = Math.floor(Math.random() * ads.length);
    }
    recentlyPlayed.push(index);
    if (recentlyPlayed.length > .5 * ads.length) {
        recentlyPlayed.shift();
    }
    return ads[index].src;
}