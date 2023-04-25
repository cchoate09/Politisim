using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class PopulatePolicyProposals : MonoBehaviour
{
    public List<string> lines;
    public List<string> usedLines;
    public TMP_Dropdown tmpdd;
    public HashSet<string> usedProposals = new HashSet<string>();
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;

    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("CampaignProposals", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        List<string> ddOptions = new List<string>{};
        foreach (string t in lines)
        {
            List<string> l = new List<string>(t.Split('\t').ToList());
            if (!usedProposals.Contains(l[1]))
            {
                ddOptions.Add(l[1]);
                usedLines.Add(t);
            }
        }
        tmpdd.AddOptions(ddOptions);

        tmpdd.onValueChanged.AddListener(delegate {
            DropdownValueChanged(tmpdd);
        });

        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void DropdownValueChanged(TMP_Dropdown change)
    {
        /*
        int i = change.value;
        List<string> l = new List<string>(lines[i].Split('\t').ToList());
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
        */
    }


}
