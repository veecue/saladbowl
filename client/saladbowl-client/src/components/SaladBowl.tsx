import Lobby from "./Lobby";
import {Team, UsersList, UserType} from "./User";
import {useEffect, useState} from "react";
import Client from "../protocol/MessageHandler";
import useWebsocket from "../hooks/WebsocketHook";
import SuggestionPhase from "./SuggestionPhase";
import PlayingPhase from "./PlayingPhase";
import {Container, Grid, Paper, Typography} from "@material-ui/core";


const host = window.location.host
const hostname = window.location.hostname
const port: number | undefined = 8080;

enum SaladBowlStatus {
    LOBBY = 0,
    SUGGESTION = 1,
    PLAYING = 2,
    NONE
}

function SaladBowl({token: gameToken}: { token?: string | null }) {

    const [playerID, setPlayerID] = useState(parseInt(sessionStorage.getItem('playerID') ?? ''));
    const [token, setToken] = useState(sessionStorage.getItem('userToken'));
    const [users, setUsers] = useState(new Map<number, UserType>());
    const [messageHandler, setMessageHandler] = useState(new Client());
    const [status, setStatus] = useState(SaladBowlStatus.LOBBY);
    const [wordNew, setWordNew] = useState({word: '', timeLeft: 0, token: ''});
    const [bowlUpdate, setBowlUpdate] = useState({current: -1, total: -1});

    const ws = useWebsocket({
        socketUrl: `ws://${port ? hostname : host}${port ? ':' + port : ''}/ws${gameToken ? '/' + gameToken : ''}`,
        retry: 3,
    });

    useEffect(() => {
        if (ws.data) {
            messageHandler.onMessage(ws.data);
        }
    }, [ws.data]);

    useEffect(() => {

        if (!ws.ready && ws.retrying) {
            console.log('socket disconnected, reconnecting...');
            // TODO display info to user
        } else if (!ws.ready && !ws.retrying) {
            console.log('socket disconnected');
            // TODO offer user to reconnect.
        } else {
            console.log('socket connected');
            const _username = sessionStorage.getItem('username');
            if (_username) {
                joinGame(_username);
            }
        }

    }, [ws.ready, ws.retrying]);

    useEffect(() => {
        if (token) {
            sessionStorage.setItem('userToken', token);
        }
    }, [token])

    useEffect(() => {
        messageHandler.onServerHello = ({playerID: _playerID, token: _token}) => {
            console.log(_playerID + ': ' + _token);
            sessionStorage.setItem('playerID', String(_playerID))
            setToken(_token);
            setPlayerID(Number(_playerID));
        };
        messageHandler.onPlayerList = value => {
            console.log('received PlayerList');
            // We need to make sure newUser is interpreted as array of tuples [any, any][] and not as array of arrays (type1 | type2)[][].
            // The second value is of type any so we don't need to import PlayerValue from th MessageHandler
            // TODO Type correctly, after merging types from User.tsx and MessageHandler.ts to a single location.
            const newUser: [number, any][] = value.map(user => [user.id, user]);
            setUsers(users => new Map(newUser));
        }
        messageHandler.onGameStatus = value => {
            console.log('Received GameStatus ' + value);
            setStatus(value);
        };
        messageHandler.onWordNew = value => {
            console.log('Received WordNew ' + JSON.stringify(value));
            setWordNew(old => {
                return {...old, ...value}
            });
        }
        messageHandler.onBowlUpdate = value => {
            console.log('Received BowlUpdate ' + JSON.stringify(value));
            setBowlUpdate(old => {
                return {...old, ...value}
            });
        }


    }, [messageHandler]);

    const joinGame = (name: string) => {
        console.log('joining game as user ' + name);
        ws.send(messageHandler.clientHello(name, token ?? undefined));
    }

    const updateGameConfig = (words: number, suggT: number, guessT: number, rounds: number) => {
        console.log('Updating gameconfig', words, suggT, guessT, rounds);
    }

    const updatePlayerInfo = (name: string, team: Team) => {
        console.log('Updating player info: ' + name + ' ' + team);
        ws.send(messageHandler.updatePlayerInfo(name, team));
    }

    const startGame = () => {
        console.log('send start game');
        ws.send(messageHandler.startGame());
    }
    const suggestWords = (words: string[]) => {
        console.log('suggesting words');
        ws.send(messageHandler.wordSuggestions(words));
    }
    const wordSuccess = () => {
        console.log('sending wordSuccess')
        ws.send(messageHandler.wordSuccess(wordNew.token));
    }

    const user = users.get(playerID);

    let content;
    switch (status) {
        case SaladBowlStatus.LOBBY:
            content = <Lobby user={user} joinGame={joinGame} onStart={startGame}
                             onReady={updatePlayerInfo}
                             onConfigSubmit={updateGameConfig}/>
            break;
        case SaladBowlStatus.SUGGESTION:
            content = <SuggestionPhase sendWords={suggestWords}/>
            break;

        case SaladBowlStatus.PLAYING:
            content = <PlayingPhase meID={playerID} users={new Map(users)} wordNew={wordNew} onSuccess={wordSuccess}
                                    bowlUpdate={bowlUpdate}/>
            break;

        default:
            content = <div>GameStatus: {SaladBowlStatus[status]} not implemented</div>;
    }

    return <Paper className="SaladBowl">
        <Grid container spacing={2}>
            <Grid item>
                <Container>{content}</Container>
            </Grid>
            <Grid item>
                <Paper>
                    <Typography variant="subtitle2">Players</Typography>
                    <UsersList users={Array.from(users.values())} meID={user?.id}/>
                </Paper>
            </Grid>
        </Grid>
    </Paper>
}

export default SaladBowl

export {SaladBowl, SaladBowlStatus}