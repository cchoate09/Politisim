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
    public TMP_Dropdown tmpdd_cat;
    public HashSet<string> usedProposals = new HashSet<string>();
    public Dictionary<string, int> startIndex = new Dictionary<string, int>();
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
        int lineNum = 0;
        lines = (txt.text.Split('\n').ToList());
        List<string> ddOptions = new List<string>{};
        List<string> ddCatOptions = new List<string>{};
        foreach (string t in lines)
        {
            List<string> l = new List<string>(t.Split('\t').ToList());
            if (!usedProposals.Contains(l[1]))
            {
                ddOptions.Add(l[1]);
                usedLines.Add(t);
                if (!startIndex.ContainsKey(l[0]))
                {
                    ddCatOptions.Add(l[0]);
                    startIndex[l[0]] = lineNum;
                }
                lineNum++;
            }
            
        }
        //ddOptions = ddOptions.OrderBy( x => Random.value ).ToList( );
        tmpdd.AddOptions(ddOptions);
        tmpdd_cat.AddOptions(ddCatOptions);

        tmpdd_cat.onValueChanged.AddListener(delegate {
            DropdownValueChanged(tmpdd_cat);
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
        List<string> ddOptions = new List<string>{};
        foreach (string t in lines)
        {
            List<string> l = new List<string>(t.Split('\t').ToList());
            if ((!usedProposals.Contains(l[1])) && (l[0].Equals(change.options[change.value].text)))
            {
                ddOptions.Add(l[1]);
                usedLines.Add(t);
            }
        }
        tmpdd.ClearOptions();
        tmpdd.AddOptions(ddOptions);
    }


}

