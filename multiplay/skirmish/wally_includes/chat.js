function eventChat(from, to, message) {
    if (message === "need truck") {
        const myTrucksCount = countDroid(DROID_CONSTRUCT, me)
        const ally = alliesList[from]

        if (to === me && myTrucksCount >= 5) {
            const closestTrucksFromAlly = enumDroid(me, DROID_CONSTRUCT).sort((obj1, obj2) => {
                return sortByDistToPlayerBase(obj1, obj2, from)
            })
    
            if (donateObject(closestTrucksFromAlly[0], from)) {
                chat(ALLIES, `${ally.name} ` + "I've sent you a truck")
            }
        } else {
            chat(ALLIES, `${ally.name} ` + "I'm sorry, I don't have so many trucks")
        }
    }

    if (message === "help me" || message === "need help") {
        const ally = alliesList[from]

        if (isHelpingAlly = true) {
            chat(ALLIES, `Sorry ${ally.name}! I'm busy right now helping someone else.`);
            return
        }

        helpAlly(ally)
    }
}
