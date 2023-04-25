using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class CampaignSetUp : MonoBehaviour
{
    public Button myButton;
    public StateChoice sc;
    public StateStaffChoice ssc;
    public GeneralElectionStateVisits gesv;
    public GameObject[] startUps;
    public PopulatePolicyProposals ppp;
    public int startStops = 20;
    public int difficultyLevel;
    public int diffMult = 2;


    // Start is called before the first frame update
    void Start()
    {
        //PlayerPrefs.DeleteAll();
        difficultyLevel = (int)Variables.Saved.Get("difficultyLevel");
        Variables.Saved.Set("availableStops",startStops-(difficultyLevel*diffMult));
        string sStaff = "";
        if (PlayerPrefs.HasKey("stateStaff_last"))
        {
            sStaff = PlayerPrefs.GetString("stateStaff_last");
            DictionaryUpdate(ssc.stateStaffData, sStaff);
        }
        if (PlayerPrefs.HasKey("stateAds_last"))
        {
            sStaff = PlayerPrefs.GetString("stateAds_last");
            DictionaryUpdate(sc.stateData, sStaff);
        }
        if (PlayerPrefs.HasKey("stateVisits_last"))
        {
            sStaff = PlayerPrefs.GetString("stateVisits_last");
            DictionaryUpdate(gesv.stateVisits, sStaff);
        }
        if (PlayerPrefs.HasKey("usedPolicies"))
        {
            sStaff = PlayerPrefs.GetString("usedPolicies");
            HashsetUpdate(ppp.usedProposals, sStaff);
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void DictionaryUpdate(Dictionary<string, string> d, string s, bool notvisit = true)
    {
        List<string> lines = new List<string>(s.Split("###").ToList());
        foreach(string line in lines)
        {
            if (!line.Equals(""))
            {
                List<string> l = new List<string>(line.Split('\t').ToList());
                if (notvisit)
                {
                    d[l[0]] = l[1];
                }
                else
                {
                    d[l[0]] = "0"+'\n'+"0"+'\n'+"0";
                }
            }
        }

    }

    void HashsetUpdate(HashSet<string> h, string s) 
    {
        List<string> lines = new List<string>(s.Split("#").ToList());
        foreach(string line in lines)
        {
            if (!line.Equals(""))
            {
                h.Add(line);
            }
        }
    }

}
