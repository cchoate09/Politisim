using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class AcceptPrimary : MonoBehaviour
{
    public Button myButton;
    public StateChoice sc;
    public StateStaffChoice ssc;
    public GeneralElectionStateVisits gesv;

    // Start is called before the first frame update
    void Start()
    {
        myButton.onClick.AddListener(onButtonClick);
    }

    void onButtonClick()
    {
        if (PlayerPrefs.HasKey("stateVisits"))
        {
            PlayerPrefs.SetString("stateVisits", formatForDict(gesv.stateVisits, PlayerPrefs.GetString("stateVisits"), true, true));
        }
        else
        {
            PlayerPrefs.SetString("stateVisits", formatForDict(gesv.stateVisits, "", false, true));
        }
        if (PlayerPrefs.HasKey("stateStaff"))
        {
            PlayerPrefs.SetString("stateStaff", formatForDict(ssc.stateStaffData, PlayerPrefs.GetString("stateStaff"), true, true));
        }
        else
        {
            PlayerPrefs.SetString("stateStaff", formatForDict(ssc.stateStaffData, "", false, true));
        }
        if (PlayerPrefs.HasKey("stateAds"))
        {
            PlayerPrefs.SetString("stateAds", formatForDict(sc.stateData, PlayerPrefs.GetString("stateAds"), true, false));
        }
        else
        {
            PlayerPrefs.SetString("stateAds", formatForDict(sc.stateData, "", false, false));
        }
        Variables.Saved.Set("CampaignBalance", (float)Variables.ActiveScene.Get("newBalance"));

        SceneManager.LoadScene(2, LoadSceneMode.Single);
    }

    string formatForDict(Dictionary<string, string> d, string s, bool update, bool integervsfloat)
    {
        string ret = "";
        List<string> lines = new List<string>(s.Split("###").ToList());
        int counter = 0;
        foreach(KeyValuePair<string,string> line in d)
        {
            if (update)
            {
                List<string> previousEntry = new List<string>(lines[counter+1].Split("##").ToList());
                List<string> previousEntryValues = new List<string>(previousEntry[1].Split("/n").ToList());
                List<string> currentEntry = new List<string>(line.Value.Split("/n").ToList());
                List<string> updatedEntry = new List<string>();
                for (int i = 0; i < currentEntry.Count(); i++)
                {
                    Debug.Log(previousEntryValues[i]);
                    Debug.Log(currentEntry[i]);
                    if (integervsfloat)
                    {
                        updatedEntry.Add((int.Parse(previousEntryValues[i])+int.Parse(currentEntry[i])).ToString());
                    }
                    else
                    {
                        updatedEntry.Add((float.Parse(previousEntryValues[i])+float.Parse(currentEntry[i])).ToString());
                    }
                    string entry = string.Join("/n", updatedEntry);
                    ret = ret + "###" + line.Key + "##" + entry;
                }
            }
            else
            {
                ret = ret + "###" + line.Key + "##" + line.Value;
            }
            counter++;
        }
        return ret;
    }
}