using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class CampaignLoad : MonoBehaviour
{
    public GameObject prefab;
    public int numIssues = 3;
    public HashSet<int> hs;
    public TextAsset txt;
    public int[] values;
    public List<string> lines;
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
        while (transform.childCount > 0) 
        {
            DestroyImmediate(transform.GetChild(0).gameObject);
        }
        TextAsset txt = (TextAsset)Resources.Load("CampaignIssues", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        int n = lines.Count();
        values = new int[numIssues];
        hs = new HashSet<int>();
        for (int i = 0; i < numIssues; i++)
        {
            int r = Random.Range(0, n-1);
            while (hs.Contains(r)) 
            {
                r = Random.Range(0, n-1);
            }
            hs.Add(r);
            values[i] = r;
        }

        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");

        for (int i = 0; i < numIssues; i++)
        {
            List<string> l = new List<string>(lines[values[i]].Split('\t').ToList());
            GameObject instance = Instantiate(prefab, transform);
            liberal = (float.Parse(l[2])/1f);
            libertarian = (float.Parse(l[3])/1f);
            owner = (float.Parse(l[4])/1f);
            worker = (float.Parse(l[5])/1f);
            religious = (float.Parse(l[6])/1f);
            immigrant = (float.Parse(l[7])/1f);
            instance.GetComponentInChildren<TextMeshProUGUI>().text = l[0] + ": " + l[1];
            instance.GetComponent<ToggleVariables>().liberal = liberal;
            instance.GetComponent<ToggleVariables>().libertarian = libertarian;
            instance.GetComponent<ToggleVariables>().immigrant = immigrant;
            instance.GetComponent<ToggleVariables>().owner = owner;
            instance.GetComponent<ToggleVariables>().worker = worker;
            instance.GetComponent<ToggleVariables>().religious = religious;
            int modifier = -1;
            Variables.Saved.Set("Liberal", li + (liberal*modifier));
            Variables.Saved.Set("Libertarian", la + (libertarian*modifier));
            Variables.Saved.Set("Workers", wo + (worker*modifier));
            Variables.Saved.Set("Immigrants", im + (immigrant*modifier));
            Variables.Saved.Set("Owners", ow + (owner*modifier));
            Variables.Saved.Set("Religious", re + (religious*modifier));
            //float modifier = li/100f * liberal + la/100f * libertarian + wo/100f * worker + ow/100f * owner + re/100f * religious + im/100f * immigrant;
            //ap -= modifier;
        }

            
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
