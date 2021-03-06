import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    InputAdornment,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from "@material-ui/core";
import React, {useReducer, useState} from "react";
import {Team, UserType} from "./User";


function UserLobby(props: { joinGame: (username: string) => void }) {
    const [name, setName] = useState(sessionStorage.getItem('username') ?? '');

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(event.target.value);
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        sessionStorage.setItem('username', name);
        props.joinGame(name);
    }

    return <div className="Lobby UserLobby">
        <form onSubmit={handleSubmit}>
            <TextField id="input-username" label="Username" value={name} required onChange={handleChange}/>
            <br/>
            <Button type="submit">Join</Button>
        </form>
    </div>
}

function ChooseTeam({
                        disabled,
                        team,
                        teams,
                        onTeamChange
                    }: { team: Team, teams: Team[], disabled?: boolean, onTeamChange: (team: Team) => void }) {
    const buttons = teams.map(team => <FormControlLabel key={team} value={team} control={<Radio/>} label={Team[team]}
                                                        disabled={disabled} labelPlacement="bottom"/>)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onTeamChange(parseInt(event.target.value));
    }

    return <FormControl component="fieldset">
        <FormLabel component="legend">Team</FormLabel>
        <RadioGroup row arial-label="team" name="team" value={team} onChange={handleChange}>
            {buttons}
        </RadioGroup>
    </FormControl>
}

function PlayerConfig(props: { name: string, team: Team, teams: Team[], ready: boolean, onReady: () => void, onNameChange: (name: string) => void, onTeamChange: (team: Team) => void }) {
    const {name, ready, team, teams} = props;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        props.onReady();
    }

    const handleNameChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        props.onNameChange(event.target.value);
    }

    return (
        <Paper>
            <Typography variant="subtitle2">User Settings</Typography>
            <form onSubmit={handleSubmit}>
                <Grid container direction="column" alignItems="center" spacing={1}>
                    <Grid item>
                        <TextField id="input-username" label="Name" value={name} onChange={handleNameChange}
                                   required disabled={ready}/>
                    </Grid>
                    <Grid item>
                        <ChooseTeam team={team} teams={teams} onTeamChange={props.onTeamChange} disabled={ready}/>
                    </Grid>
                    <Grid item>
                        <Button type="submit">{ready ? "Edit" : "Ready"}</Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
}

function GameConfig(props: { isOwner: boolean, defaults: { maxWords: number, suggestionTime: number, guessingTime: number, rounds: number }, onSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const {onSubmit, defaults, isOwner} = props;
    const [values, setValues] = useState(defaults);

    function errorReducer(state: { maxWords: string, suggestionTime: string, guessingTime: string, rounds: string }, action: { nam: string, val: number }): { maxWords: string; suggestionTime: string; guessingTime: string; rounds: string } {
        let msg;
        if (isNaN(action.val)) {
            msg = 'Not a umber';
        } else if (action.val < 0) {
            msg = 'Must be greater than 0';
        } else {
            msg = '';
        }

        return {...state, [action.nam]: msg}
    }

    const [errors, dispatchErrors] = useReducer(errorReducer, {
        maxWords: '',
        suggestionTime: '',
        guessingTime: '',
        rounds: ''
    });

    const {
        guessingTime: guessingTimeDefault,
        rounds: roundsDefault,
        maxWords: maxWordsDefault,
        suggestionTime: suggestionTimeDefault,
    } = defaults;
    const {guessingTime, rounds, maxWords, suggestionTime} = values;


    const noErrors = () => {
        return Object.values(errors).reduce((pre, cur) => pre && cur === '', true);
    }

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const nam = event.target.name;
        let val = parseInt(event.target.value);
        val = isNaN(val) || val < 0 ? 0 : val;
        dispatchErrors({nam, val});

        setValues({...values, [nam]: isNaN(val) ? undefined : val});
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (noErrors()) {
            onSubmit(maxWords, suggestionTime, guessingTime, rounds);
        }
    }

    const iaSeconds = <InputAdornment position="end">s</InputAdornment>
    const buttonDisabled = () => {
        return maxWordsDefault === maxWords && suggestionTimeDefault === suggestionTime && guessingTimeDefault === guessingTime && roundsDefault === rounds;
    }


    return (
        <Paper>
            <Typography variant="subtitle2">Game Config</Typography>
            <form onSubmit={handleSubmit} autoComplete="off" onError={() => console.log('error')}>
                <Grid container direction="column">
                    <Grid item>
                        <TextField id="input-maxWords" label="Words to submit" type={isOwner ? "number" : undefined}
                                   name="maxWords"
                                   required disabled={!isOwner}
                                   value={maxWords ?? ''} onChange={handleChange} placeholder={maxWordsDefault + ''}
                                   error={errors.maxWords !== ''} helperText={errors.maxWords}/>
                    </Grid>
                    <TextField id="input-suggestionTime" label="Suggestion Time" type={isOwner ? "number" : undefined}
                               name="suggestionTime"
                               required disabled={!isOwner}
                               value={suggestionTime ?? ''} onChange={handleChange}
                               placeholder={suggestionTimeDefault + ''}
                               error={errors.suggestionTime !== ''} helperText={errors.suggestionTime}/>
                    <Grid item>
                        <TextField id="input-guessingTime" label="Time to guess" type={isOwner ? "number" : undefined}
                                   name="guessingTime"
                                   required disabled
                                   value={guessingTime ?? ''} onChange={handleChange}
                                   placeholder={guessingTimeDefault + ''}
                                   error={errors.guessingTime !== ''} helperText={errors.guessingTime}/>
                    </Grid>
                    <TextField id="input-rounds" label="Rounds to play" type={isOwner ? "number" : undefined}
                               name="rounds"
                               required disabled={!isOwner}
                               value={rounds ?? ''} onChange={handleChange} placeholder={roundsDefault + ''}
                               error={errors.rounds !== ''} helperText={errors.rounds}/>
                    {isOwner ?
                        <Grid item>
                            <Button type="submit" disabled={buttonDisabled() || !noErrors()}>Set</Button>
                        </Grid>
                        : null}
                </Grid>
            </form>
        </Paper>
    )
        ;
}

function PlayerLobby(props: { user: UserType, teams: Team[], onReady: (name: string, team: Team) => void, onStart: () => void, onConfigSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const {user, teams} = props;

    const [ready, setReady] = useState(user.name !== undefined && user.team !== undefined);
    const [name, setName] = useState(user.name ?? '');
    const [team, setTeam] = useState(user.team);

    const handleStart = () => {
        handleUserConfigReady();
        props.onStart()
    }

    function handleUserConfigReady() {
        if (!ready) {
            props.onReady(name, team);
        }
        setReady(!ready);
    }

    return (
        <Box>
            <Typography variant="subtitle1">Lobby</Typography>
            <Grid container className="PlayerLobby" direction="column" spacing={2}>
                <Grid item>
                    <GameConfig defaults={{guessingTime: 30, maxWords: 15, suggestionTime: 180, rounds: 3}}
                                onSubmit={props.onConfigSubmit} isOwner={user.isOwner}/>
                </Grid>
                <Grid item>
                    <Paper>
                        <PlayerConfig name={name} team={team} teams={teams} ready={ready}
                                      onReady={handleUserConfigReady} onNameChange={setName} onTeamChange={setTeam}
                        />
                    </Paper>
                </Grid>
                {user.isOwner ? <Button onClick={handleStart}>StartGame</Button> : null}
            </Grid>
        </Box>
    );
}

function Lobby(props: { user?: UserType, joinGame: (name: string) => void, onReady: (name: string, team: Team) => void, onStart: () => void, onConfigSubmit: (maxWords: number, suggestionTime: number, guessingTime: number, rounds: number) => void }) {
    const {user, joinGame, onReady, onStart, onConfigSubmit} = props;

    if (user) {
        return <PlayerLobby user={user} teams={[Team.BLUE, Team.RED]} onReady={onReady} onStart={onStart}
                            onConfigSubmit={onConfigSubmit}/>
    } else {
        return <UserLobby joinGame={joinGame}/>
    }
}

export default Lobby;

export {Lobby}