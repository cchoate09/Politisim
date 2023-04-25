using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class PrimarySchedule : MonoBehaviour
{
    public List<string> lines;
    public GameObject prefab;
    public TextAsset txt;
    public int counter = 0;
    public int totalShown = 4;
    public int stopsAvailable = 10;
    public int curPrimary;
    public float fundraisingMult = 1000000;

    // Start is called before the first frame update
    void Start()
    {
        curPrimary = (int)Variables.Saved.Get("curPrimary");
        Variables.Saved.Set("availableStops", stopsAvailable);
        bool partyChoice = (bool)Variables.Saved.Get("Democrats");
        int curMonth = (int)Variables.Saved.Get("currentMonth");
        int curDay = (int)Variables.Saved.Get("currentDay");

        if (partyChoice) 
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimarySchedule_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimarySchedule_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());

        foreach(string t in lines) 
        {
            List<string> l = new List<string>(t.Split('\t').ToList());
            List<string> date = new List<string>(l[1].Split('/').ToList());
            if (counter >= curPrimary && counter < curPrimary + totalShown)
            {
                GameObject instance = Instantiate(prefab, transform);
                instance.GetComponentInChildren<TextMeshProUGUI>().text = l[0];
                counter++;
            }
            else
            {
                counter++;
            }
        }
        GameObject fundraising = Instantiate(prefab, transform);
        fundraising.GetComponentInChildren<TextMeshProUGUI>().text = "Fundraising";
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
