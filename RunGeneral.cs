using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class RunGeneral : MonoBehaviour
{
    public TextAsset txt;
    public List<string> lines;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float gli;
    public float gla;
    public float gre;
    public float gow;
    public float gwo;
    public float gim;
    public RectTransform playerBar;
    public RectTransform oppBar;
    public int initialPos = 160;
    public Button startPrimary;
    public TextMeshProUGUI buttonLabel;
    public Dictionary<string, string> staffChoices = new Dictionary<string, string>();
    public Dictionary<string, string> adChoices = new Dictionary<string, string>();
    public Dictionary<string, string> visitChoices = new Dictionary<string, string>();
    public int playerElectoralVotes = 0;
    public int opponentElectoralVotes = 0;
    public int nextState = 0;
    public TextMeshProUGUI playerResult;
    public TextMeshProUGUI oppResult;
    public int width = 30;
    public TextMeshProUGUI resultsBox;
    public float difficultyLift = 20f;
    public GameObject victoryScreen;
    public GameObject defeatScreen;
    public float staffDiv = 3;
    public float votesToWin = 270f;

    // Start is called before the first frame update
    void Start()
    {
        txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
        gli = (float)Variables.Saved.Get("gLiberal");
        gla = (float)Variables.Saved.Get("gLibertarian");
        gwo = (float)Variables.Saved.Get("gWorkers");
        gow = (float)Variables.Saved.Get("gOwners");
        gre = (float)Variables.Saved.Get("gReligious");
        gim = (float)Variables.Saved.Get("gImmigrants");
        formatForDict(visitChoices, PlayerPrefs.GetString("stateVisits"));
        formatForDict(staffChoices, PlayerPrefs.GetString("stateStaff"));
        formatForDict(adChoices, PlayerPrefs.GetString("stateAds"));
        startPrimary.onClick.AddListener(delegate {onButtonClicked(startPrimary);});
        playerResult.text = playerElectoralVotes.ToString() + " EVs" + '\n' + (string)Variables.Saved.Get("CharacterName");
        oppResult.text = opponentElectoralVotes.ToString() + " EVs" + '\n' + (string)Variables.Saved.Get("NameGeneral");
        playerBar.transform.position = new Vector3(playerBar.transform.position.x, initialPos + playerElectoralVotes/4f, playerBar.transform.position.z);
        playerBar.sizeDelta = new Vector2(playerElectoralVotes/2f, width);
        oppBar.transform.position = new Vector3(oppBar.transform.position.x, initialPos + opponentElectoralVotes/4f, oppBar.transform.position.z);
        oppBar.sizeDelta = new Vector2(opponentElectoralVotes/2f, width);

    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void formatForDict(Dictionary<string, string> d, string s)
    {
        List<string> lines = new List<string>(s.Split("###").ToList());
        foreach(string line in lines)
        {
            if (!line.Equals(""))
            {
                List<string> keyValue = new List<string>(line.Split('\t').ToList());
                d[keyValue[0]] = keyValue[1];
            }
        }
    }

    void onButtonClicked(Button b)
    {
        List<string> l = new List<string>(lines[nextState].Split('\t').ToList());
        string stateName = l[0];
        int EV = int.Parse(l[1]);
        float liberal = (float.Parse(l[2]));
        float libertarian = (float.Parse(l[3]));
        float owner = (float.Parse(l[4]));
        float worker = (float.Parse(l[5]));
        float religious = (float.Parse(l[6]));
        float immigrant = (float.Parse(l[7]));
        float playerScore = Mathf.Max(0, li*liberal) + Mathf.Max(0, la*libertarian) + Mathf.Max(0, ow*owner) + Mathf.Max(0, wo*worker) + Mathf.Max(0, re*religious) + Mathf.Max(0, im*immigrant);
        playerScore /= 2f;
        playerScore = Mathf.Max(1, playerScore);
        float oppScore = Mathf.Max(0, gli*liberal) + Mathf.Max(0, gla*libertarian) + Mathf.Max(0, gow*owner) + Mathf.Max(0, gwo*worker) + Mathf.Max(0, gre*religious) + Mathf.Max(0, gim*immigrant);
        int diff = (int)Variables.Saved.Get("difficultyLevel");
        oppScore /= 2f;
        oppScore = Mathf.Max(1, oppScore);
        oppScore += (difficultyLift*(1.0f+diff));
        float intAds = 0f;
        float tvAds = 0f;
        float mailers = 0f;
        int staff1 = 0;
        int staff2 = 0;
        int staff3 = 0;
        int visits = 0;
        if (adChoices.ContainsKey(stateName))
        {
            var anArray = adChoices[stateName].Split('\n');
            intAds = float.Parse(anArray[0]);
            tvAds = float.Parse(anArray[1]);
            mailers = float.Parse(anArray[2]);
        }
        else
        {
            intAds = 0f;
            tvAds = 0f;
            mailers = 0f;
        }
        if (staffChoices.ContainsKey(stateName))
        {
            var anArray = staffChoices[stateName].Split('\n');
            staff1 = int.Parse(anArray[0]);
            staff2 = int.Parse(anArray[1]);
            staff3 = int.Parse(anArray[2]);
        }
        else
        {
            staff1 = 0;
            staff2 = 0;
            staff3 = 0;
        }
        if (visitChoices.ContainsKey(stateName))
        {
            var anArray = visitChoices[stateName].Split('\n');
            visits = int.Parse(anArray[0]);
        }
        else
        {
            visits = 0;
        }
        float visitMult = (float)Variables.Saved.Get("Campaigning") + 0.5f;
        playerScore += Mathf.Log(Mathf.Max(1, intAds)*(Mathf.Max(1, staff2)/staffDiv)*(2*liberal + libertarian + owner)/100f) + Mathf.Log(Mathf.Max(1, tvAds)*(Mathf.Max(1, staff2)/staffDiv)*(liberal + 2*libertarian + owner)/100f) + Mathf.Log(Mathf.Max(1, mailers)*(Mathf.Max(1, staff1)/staffDiv)*(liberal + libertarian + 2*owner)/100f) + (visits*visitMult) + (staff1/staffDiv);
        playerScore = Mathf.Max(1, playerScore);
        if (playerScore > oppScore)
        {
            playerElectoralVotes += EV;
        }
        else
        {
            opponentElectoralVotes += EV;
        }
        nextState++;
        setUpText();
        playerResult.text = playerElectoralVotes.ToString() + " EVs" + '\n' + (string)Variables.Saved.Get("CharacterName");
        oppResult.text = opponentElectoralVotes.ToString() + " EVs" + '\n' + (string)Variables.Saved.Get("NameGeneral");
        playerBar.transform.position = new Vector3(playerBar.transform.position.x, initialPos + playerElectoralVotes/4f, playerBar.transform.position.z);
        playerBar.sizeDelta = new Vector2(playerElectoralVotes/2f, width);
        oppBar.transform.position = new Vector3(oppBar.transform.position.x, initialPos + opponentElectoralVotes/4f, oppBar.transform.position.z);
        oppBar.sizeDelta = new Vector2(opponentElectoralVotes/2f, width);
        float playerperc = playerScore / (playerScore + oppScore);
        string displayText = l[0] + '\n' + (string)Variables.Saved.Get("CharacterName") + ": " + (Mathf.Round(playerperc * 100f)).ToString() + "%" + '\n' + (string)Variables.Saved.Get("NameGeneral") + ": " + (Mathf.Round((1-playerperc) * 100f)).ToString() + "%";
        resultsBox.text = displayText;
    }

    void setUpText()
    {
        if (nextState >= lines.Count())
        {
            if (playerElectoralVotes > opponentElectoralVotes)
            {
                victoryScreen.SetActive(true);
            }
            else
            {
                defeatScreen.SetActive(true);
            }
        }
        else if (playerElectoralVotes >= votesToWin)
        {
            victoryScreen.SetActive(true);
        }
        else if (opponentElectoralVotes > votesToWin)
        {
            defeatScreen.SetActive(true);
        }
        else
        {
            List<string> l = new List<string>(lines[nextState].Split('\t').ToList());
            buttonLabel.text = "Get " + l[0] + " Results";
        }
    }

}
