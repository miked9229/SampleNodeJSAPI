import axios from 'axios';
import cheerio, { load } from 'cheerio';
import e from 'express';
import mysql from 'mysql';

const connectionString = process.env.DATABASE_URL || '';
const connection = mysql.createConnection(connectionString);
connection.connect();

const getCharacterPageNames = async () => {
    const url = "https://throneofglass.fandom.com/wiki/Category:Kingdom_of_Ash_characters"
    const {data} = await axios.get(url);
    const $ = cheerio.load(data);
    const categories = $('ul.category-page__members-for-char');

    const characterPageNames = [];

    for (let i = 0; i < categories.length; i++) {
        const ul = categories[i];
        const charactersLIs = $(ul).find('li.category-page__member');
        for (let j = 0; j < charactersLIs.length; j++) {
            const li = charactersLIs[j];
            const path = $(li).find('a.category-page__member-link').attr('href') || "";
            const name = path.replace("/wiki/", "");
            characterPageNames.push(name);
        }
    }

    return characterPageNames;
}

const getCharacterInfo = async (characterName: String) => {
    const url = "https://throneofglass.fandom.com/wiki/" + characterName;
    const { data } = await axios.get(url)
    const $ = cheerio.load(data);

    let name = $(`h2[data-source="name"]`).text();
    const species = $(`div[data-source="species"] > div.pi-data-value.pi-font`).text()
    const image = $(`.image.image-thumbnail > img`).attr('src');
    if (!name) {
        name = characterName.replace('_', ' ');
    }

    const characterInfo = {
        name, species, image
    }

    return characterInfo;

}

const loadCharacters = async () => {
    const characterPageNames = await getCharacterPageNames();
    const characterInfoPromises = characterPageNames.map(characterName => getCharacterInfo(characterName));
    const characters = await Promise.all(characterInfoPromises);
    const values = characters.map((character, i) => [i, character.name, character.species, character.image]);

    const sql = "INSERT INTO Characters (id, name, species, image) VALUES ?";
    connection.query(sql, [values], (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("YAYYYY");
        }
     


    })
}

loadCharacters();


