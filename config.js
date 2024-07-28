const SEED = 42; // the answer to life the universe and everything


/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} array - The array to shuffle.
 * @returns {Array} - The shuffled array.
 */
function shuffle(array) {
    let m = array.length, t, i;

    // Set the initial seed.
    let seed = SEED;

    // Continue shuffling until the seed reaches zero.
    while (seed) {
        // Start shuffling from the end of the array.
        m = array.length;
        while (m) {
            // Pick a random index from the unshuffled portion of the array.
            i = Math.floor(Math.random() * m--);

            // Swap the element at the current index with the last unshuffled element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }

        // Decrement the seed.
        seed--;
    }

    // Return the shuffled array.
    return array;
}

module.exports = {
    ollamaEndpoint: 'http://localhost:11434/api/chat', // Ollama API endpoint
    agents: shuffle([
        { name: 'Alpha', model: 'gemma:2b' },
        { name: 'Beta', model: 'phi3' },
        { name: 'Gamma', model: 'qwen:4b' }
    ]),
    judge: { name: 'Judge', model: 'llama3.1:8b' },
    shuffle
};