using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class AcceptGeneral : MonoBehaviour
{
    public Button myButton;
    public StateChoice sc;
    public StateStaffChoice ssc;
    public GeneralElectionStateVisits gesv;
    public GameObject warning;
    public PopulatePolicyProposals ppp;
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

    // Start is called before the first frame update
    void Start()
    {
        myButton.onClick.AddListener(onButtonClick);
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
    }

    void onButtonClick()
    {
        if ((float)Variables.ActiveScene.Get("newBalance") < 0)
        {
            warning.SetActive(true);
            return;
        }

        if (ppp.usedLines.Count > 0)
        {
            int i = ppp.tmpdd.value;
            int j = ppp.startIndex[ppp.tmpdd_cat.options[ppp.tmpdd_cat.value].text] + i;
            List<string> l = new List<string>(ppp.usedLines[i].Split('\t').ToList());
            liberal = (float.Parse(l[2])/1f);
            libertarian = (float.Parse(l[3])/1f);
            immigrant = (float.Parse(l[4])/1f);
            owner = (float.Parse(l[5])/1f);
            worker = (float.Parse(l[6])/1f);
            religious = (float.Parse(l[7])/1f);
            int modifier = 1;
            Variables.Saved.Set("Liberal", li + (liberal*modifier));
            Variables.Saved.Set("Libertarian", la + (libertarian*modifier));
            Variables.Saved.Set("Workers", wo + (worker*modifier));
            Variables.Saved.Set("Immigrants", im + (immigrant*modifier));
            Variables.Saved.Set("Owners", ow + (owner*modifier));
            Variables.Saved.Set("Religious", re + (religious*modifier));

            PlayerPrefs.SetString("usedPolicies", formatHSforDict(ppp.usedProposals, l[1], true));
        }

        if (PlayerPrefs.HasKey("stateVisits"))
        {
            PlayerPrefs.SetString("stateVisits", formatForDict(gesv.stateVisits, PlayerPrefs.GetString("stateVisits"), true, true));
            PlayerPrefs.SetString("stateVisits_last", formatForDict(gesv.stateVisits, "", false, true));
        }
        else
        {
            string ret = formatForDict(gesv.stateVisits, "", false, true);
            if (!ret.Equals(""))
            {
                PlayerPrefs.SetString("stateVisits", ret);
                PlayerPrefs.SetString("stateVisits_last", ret);
            }
        }
        if (PlayerPrefs.HasKey("stateStaff"))
        {
            PlayerPrefs.SetString("stateStaff", formatForDict(ssc.stateStaffData, PlayerPrefs.GetString("stateStaff"), true, true));
            PlayerPrefs.SetString("stateStaff_last", formatForDict(ssc.stateStaffData, "", false, true));
        }
        else
        {
            string ret = formatForDict(ssc.stateStaffData, "", false, true);
            if (!ret.Equals(""))
            {
                PlayerPrefs.SetString("stateStaff", ret);
                PlayerPrefs.SetString("stateStaff_last", ret);
            }
        }
        if (PlayerPrefs.HasKey("stateAds"))
        {
            PlayerPrefs.SetString("stateAds", formatForDict(sc.stateData, PlayerPrefs.GetString("stateAds"), true, false));
            PlayerPrefs.SetString("stateAds_last", formatForDict(sc.stateData, PlayerPrefs.GetString("stateAds"), false, false));
        }
        else
        {
            string ret = formatForDict(sc.stateData, PlayerPrefs.GetString("stateAds"), false, false);
            if (!ret.Equals(""))
            {
                PlayerPrefs.SetString("stateAds", ret);
                PlayerPrefs.SetString("stateAds_last", ret);
            }
        }
        Variables.Saved.Set("CampaignBalance", (float)Variables.ActiveScene.Get("newBalance"));

        SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex + 1, LoadSceneMode.Single);
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
                List<string> previousEntry = new List<string>(lines[counter].Split('\t').ToList());
                List<string> previousEntryValues = new List<string>(previousEntry[1].Split('\n').ToList());
                List<string> currentEntry = new List<string>(line.Value.Split('\n').ToList());
                List<string> updatedEntry = new List<string>();
                for (int i = 0; i < currentEntry.Count(); i++)
                {
                    if (integervsfloat)
                    {
                        updatedEntry.Add((int.Parse(previousEntryValues[i])+int.Parse(currentEntry[i])).ToString());
                    }
                    else
                    {
                        updatedEntry.Add((float.Parse(previousEntryValues[i])+float.Parse(currentEntry[i])).ToString());
                    }
                }
                string entry = string.Join('\n', updatedEntry);
                if (!ret.Equals(""))
                {
                    ret = ret + "###" + line.Key + '\t' + entry;
                }
                else
                {
                    ret = line.Key + '\t' + entry;
                }
            }
            else
            {
                if (!ret.Equals(""))
                {
                    ret = ret + "###" + line.Key + '\t' + line.Value;
                }
                else
                {
                    ret = line.Key + '\t' + line.Value;
                }
            }
            counter++;
        }
        return ret;
    }

    string formatHSforDict(HashSet<string> h, string s, bool update)
    {
        foreach(var value in h)
        {
            s = s + "#" + value;
        }
        return s;
    }
}
