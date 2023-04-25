using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class ConventionProposals : MonoBehaviour
{
    public List<string> lines;
    public TMP_Dropdown tmpdd;
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public int choiceIndex = 0;


    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("CampaignProposals", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        List<string> ddOptions = new List<string>{};
        foreach (string t in lines)
        {
            List<string> l = new List<string>(t.Split('\t').ToList());
            ddOptions.Add(l[1]);
        }
        tmpdd.AddOptions(ddOptions);

        tmpdd.onValueChanged.AddListener(delegate {
            DropdownValueChanged(tmpdd);
        });
        DropdownValueChanged(tmpdd);
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void DropdownValueChanged(TMP_Dropdown change)
    {
        choiceIndex = change.value;
        List<string> l = new List<string>(lines[choiceIndex].Split('\t').ToList());
        liberal = (float.Parse(l[2])/1f);
        libertarian = (float.Parse(l[3])/1f);
        immigrant = (float.Parse(l[4])/1f);
        owner = (float.Parse(l[5])/1f);
        worker = (float.Parse(l[6])/1f);
        religious = (float.Parse(l[7])/1f);
    }
}
