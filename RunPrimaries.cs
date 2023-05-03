using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class RunPrimaries : MonoBehaviour
{
    public int numPrimaries = 4;
    public GameObject removePicture;
    public int curPrimary;
    public GameObject prefab;
    public TextAsset txt;
    public List<string> lines;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public int ideologyMult = 4;
    public List<GameObject> objectsToDestroy;
    public float userScore = 0;
    public Button startPrimary;
    float rival1;
    float rival2;
    float rival3;
    float rival4;
    bool partyType = true;
    public TextMeshProUGUI stateTitle;
    public TextMeshProUGUI delegateCount;
    public TextMeshProUGUI buttonLabel;
    public float visitMult = 2f;
    public float randomHigh = 5f;
    public float randomLow = -3f;
    public Dictionary<string, string> staffChoices = new Dictionary<string, string>();
    public Dictionary<string, string> adChoices = new Dictionary<string, string>();
    public Dictionary<string, string> visitChoices = new Dictionary<string, string>();
    public float momentumMult = .05f;
    public BannerAds cleanBanner;
    public float staffDiv = 3;
    public float campaignRefresh = 1000000f;
    public float maxRatio = 1.25f;
    public float staffFundDiv = 3f;
    public bool flag = false;
    public bool run1 = false;
    public GameObject victoryScreen;
    public GameObject defeatScreen;
    public GameObject newsScreen;

    void setUpText()
    {
        if (((curPrimary) % numPrimaries == 0) && (run1))
        {
            newsScreen.SetActive(true);
            buttonLabel.text = "End Primary Day";
            flag = true;
        }
        else
        {
            List<string> l = new List<string>(lines[curPrimary].Split('\t').ToList());
            //startPrimary.onClick.AddListener(delegate {onButtonClicked(startPrimary);});
            buttonLabel.text = "Start " + l[0] + " Primary";
        }
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

    // Start is called before the first frame update
    void Start()
    {
        //Import global Variables
        rival1 = (float)Variables.Saved.Get("p_rival1");
        rival2 = (float)Variables.Saved.Get("p_rival2");
        rival3 = (float)Variables.Saved.Get("p_rival3");
        rival4 = (float)Variables.Saved.Get("p_rival4");

        partyType = (bool)Variables.Saved.Get("Democrats");
        li = (float)Variables.Saved.Get("Liberal")/1f;
        la = (float)Variables.Saved.Get("Libertarian")/1f;
        wo = (float)Variables.Saved.Get("Workers")/1f;
        ow = (float)Variables.Saved.Get("Owners")/1f;
        re = (float)Variables.Saved.Get("Religious")/1f;
        im = (float)Variables.Saved.Get("Immigrants")/1f;
        curPrimary = (int)Variables.Saved.Get("curPrimary");

        formatForDict(visitChoices, PlayerPrefs.GetString("stateVisits"));
        formatForDict(staffChoices, PlayerPrefs.GetString("stateStaff"));
        formatForDict(adChoices, PlayerPrefs.GetString("stateAds"));
        //Set right schedule
        if (partyType)
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        setUpText();
        //List<string> l = new List<string>(lines[curPrimary].Split('\t').ToList());
        startPrimary.onClick.AddListener(delegate {onButtonClicked(startPrimary);});
        //startPrimary.GetComponentsInChildren<TextMeshProUGUI>().text = "Start " + l[0] + " Primary";
        int delegateTotal = 0;
        for (int i = curPrimary; i < Mathf.Min(curPrimary+numPrimaries, lines.Count); i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            delegateTotal += int.Parse(l[1]);
        }
        delegateCount.text = delegateTotal.ToString() + " delegates up for grabs in this round";
    }

    void onButtonClicked(Button b)
    {
        removePicture.SetActive(false);
        float userDelegates = (float)Variables.Saved.Get("currentDelegates");
        float targetDelegates = (float)Variables.Saved.Get("targetDelegates");
        float del1 = (float)Variables.Saved.Get("d_rival1");
        float del2 = (float)Variables.Saved.Get("d_rival2");
        float del3 = (float)Variables.Saved.Get("d_rival3");
        float del4 = (float)Variables.Saved.Get("d_rival4");

        if ((flag) || (curPrimary == lines.Count - 1))
        {
            cleanBanner.HideBannerAd();
            if (curPrimary == lines.Count - 1)
            {
                if ((userDelegates > del1) && (userDelegates > del2) && (userDelegates > del3) && (userDelegates > del4))
                {
                    PlayerPrefs.DeleteAll();
                    cleanBanner.HideBannerAd();
                    Variables.Saved.Set("sceneNumber", 5);
                    victoryScreen.SetActive(true);
                }
                else
                {
                    defeatScreen.SetActive(true);
                }
            }
            else
            {
                SceneManager.LoadScene(1, LoadSceneMode.Single);
            }
        }
        else if (userDelegates >= targetDelegates)
        {
            PlayerPrefs.DeleteAll();
            cleanBanner.HideBannerAd();
            Variables.Saved.Set("sceneNumber", 5);
            victoryScreen.SetActive(true);
        }
        else if ((del1 >= targetDelegates) || (del2 >= targetDelegates) || (del3 >= targetDelegates) || (del4 >= targetDelegates))
        {
            //lose screen
            cleanBanner.HideBannerAd();
            defeatScreen.SetActive(true);
        }
        else {
            run1 = true;
            foreach (GameObject g in objectsToDestroy)
            {
                Destroy(g);
            }
            //Loop through primaries and get results and allocate delegates
            List<string> l = new List<string>(lines[curPrimary].Split('\t').ToList());
            stateTitle.text = l[0];
            string stateName = l[0];
            delegateCount.text = l[1] + " delegates";
            float delegates = (float.Parse(l[1])/1f);
            liberal = (float.Parse(l[2]));
            libertarian = (float.Parse(l[3]));
            owner = (float.Parse(l[4]));
            worker = (float.Parse(l[5]));
            religious = (float.Parse(l[6]));
            immigrant = (float.Parse(l[7]));
            if (partyType) 
            {
                userScore = Mathf.Max(1, (liberal*li) + (libertarian*la) + (immigrant*im) + (owner*ow) + (worker*wo) + (religious*re));
            }
            else
            {
                userScore = Mathf.Max(1, (liberal*li) + (libertarian*la) + (immigrant*im) + (owner*ow) + (worker*wo) + (religious*re));
            }
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
            userScore /= 2f;
            float visitMult = (float)Variables.Saved.Get("Campaigning") + 0.5f;
            userScore += Mathf.Log(Mathf.Max(1, intAds)*(Mathf.Max(1, staff2)/staffDiv)*(2*liberal + libertarian + owner)/100f) + Mathf.Log(Mathf.Max(1, tvAds)*(Mathf.Max(1, staff2)/staffDiv)*(liberal + 2*libertarian + owner)/100f) + Mathf.Log(Mathf.Max(1, mailers)*(Mathf.Max(1, staff1)/staffDiv)*(liberal + libertarian + 2*owner)/100f) + (visits*visitMult) + (staff1/staffDiv);
            userScore = Mathf.Max(userScore, 1);
            rival1 = Mathf.Max(1, (float)Variables.Saved.Get("p_rival1") + (Random.Range(randomLow, randomHigh)));
            rival2 = Mathf.Max(1, (float)Variables.Saved.Get("p_rival2") + (Random.Range(randomLow, randomHigh)));
            rival3 = Mathf.Max(1, (float)Variables.Saved.Get("p_rival3") + (Random.Range(randomLow, randomHigh)));
            rival4 = Mathf.Max(1, (float)Variables.Saved.Get("p_rival4") + (Random.Range(randomLow, randomHigh)));

            float averageRivals = (userScore + rival1 + rival2 + rival3 + rival4) / 5f;

            float diff = (int)Variables.Saved.Get("difficultyLevel") + 1.0f;
            campaignRefresh /= diff;

            Variables.Saved.Set("CampaignBalance", (float)Variables.Saved.Get("CampaignBalance") + Mathf.Min(maxRatio, (userScore/averageRivals)) * campaignRefresh);
            Variables.Saved.Set("p_rival1", rival1 * Mathf.Min(1+(momentumMult/(Mathf.Min(5, curPrimary+1))), (rival1/averageRivals)));
            Variables.Saved.Set("p_rival2", rival2 * Mathf.Min(1+(momentumMult/(Mathf.Min(5, curPrimary+1))), (rival2/averageRivals)));
            Variables.Saved.Set("p_rival3", rival3 * Mathf.Min(1+(momentumMult/(Mathf.Min(5, curPrimary+1))), (rival3/averageRivals)));
            Variables.Saved.Set("p_rival4", rival4 * Mathf.Min(1+(momentumMult/(Mathf.Min(5, curPrimary+1))), (rival4/averageRivals)));
            float totalScore = userScore + rival1 + rival2 + rival3 + rival4;
            float playerScore = userScore/totalScore;
            float playerDelegates = playerScore * delegates;
            float score1 = rival1/totalScore;
            float d1 = score1 * delegates;
            float score2 = rival2/totalScore;
            float d2 = score2 * delegates;
            float score3 = rival3/totalScore;
            float d3 = score3 * delegates;
            float score4 = rival4/totalScore;
            float d4 = score4 * delegates;


            List<float> scores = new List<float>();
            scores.Add(playerScore);
            scores.Add(score1);
            scores.Add(score2);
            scores.Add(score3);
            scores.Add(score4);
            List<string> names = new List<string>();
            names.Add((string)Variables.Saved.Get("CharacterName"));
            names.Add((string)Variables.Saved.Get("Name1"));
            names.Add((string)Variables.Saved.Get("Name2"));
            names.Add((string)Variables.Saved.Get("Name3"));
            names.Add((string)Variables.Saved.Get("Name4"));
            for (int j = 0; j < scores.Count(); j++)
            {
                GameObject instance = Instantiate(prefab, transform);
                TextMeshProUGUI[] allChildren = instance.GetComponentsInChildren<TextMeshProUGUI>();
                allChildren[0].text = names[j];
                allChildren[1].text = Mathf.RoundToInt(scores[j]*100).ToString() + "%";
                objectsToDestroy.Add(instance);
            }
            Variables.Saved.Set("d_rival1", (float)Variables.Saved.Get("d_rival1") + d1);
            Variables.Saved.Set("d_rival2", (float)Variables.Saved.Get("d_rival2") + d2);
            Variables.Saved.Set("d_rival3", (float)Variables.Saved.Get("d_rival3") + d3);
            Variables.Saved.Set("d_rival4", (float)Variables.Saved.Get("d_rival4") + d4);
            Variables.Saved.Set("currentDelegates", (float)Variables.Saved.Get("currentDelegates") + playerDelegates);            
            curPrimary++;
            //numPrimaries--;
            Variables.Saved.Set("curPrimary", curPrimary);
            setUpText();
        }
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
